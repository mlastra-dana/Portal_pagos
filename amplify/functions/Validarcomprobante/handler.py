import base64
import boto3
import json
import mimetypes
import os
import re
import traceback
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional

from botocore.config import Config
from botocore.exceptions import ClientError


BEDROCK_REGION = os.getenv("BEDROCK_REGION", os.getenv("AWS_REGION", "us-east-1"))
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-7-sonnet-20250219-v1:0")
RESULT_BUCKET = os.getenv("RESULT_BUCKET", "")
RESULT_PREFIX = os.getenv("RESULT_PREFIX", "receipt-validations")

bedrock = boto3.client(
    "bedrock-runtime",
    region_name=BEDROCK_REGION,
    config=Config(
        connect_timeout=5,
        read_timeout=45,
        retries={"max_attempts": 2, "mode": "standard"},
    ),
)
s3 = boto3.client("s3")


GENERIC_EXTRACTION_PROMPT = """
Actua como un sistema universal de extraccion de comprobantes de pago.
Debes analizar cualquier comprobante, recibo o confirmacion de pago y responder SOLO JSON valido.
No agregues explicaciones, markdown ni texto adicional.

TIPOS DE DOCUMENTO POSIBLES:
- transferencia bancaria
- deposito bancario
- pago movil
- zelle
- recibo POS
- comprobante de billetera digital
- transferencia internacional
- comprobante de cajero
- confirmacion de pago web o app bancaria

DEVUELVE EXACTAMENTE ESTE JSON:
{
  "documentType": null,
  "issuerName": null,
  "issuerBankName": null,
  "issuerBankCode": null,
  "senderName": null,
  "senderAccount": null,
  "recipientName": null,
  "recipientAccount": null,
  "destinationBankName": null,
  "destinationBankCode": null,
  "transactionDate": null,
  "transactionTime": null,
  "amount": null,
  "currency": null,
  "reference": null,
  "operationNumber": null,
  "paymentMethod": null,
  "channel": null,
  "countryCode": null,
  "language": null,
  "summary": null,
  "notes": []
}

REGLAS:
1) Extrae datos de cualquier comprobante de pago, sin asumir pais especifico.
2) Si un campo no aparece de forma razonablemente clara, devuelve null.
3) amount debe ser numero, no string.
4) transactionDate debe venir en formato YYYY-MM-DD cuando sea posible normalizarla.
5) transactionTime debe venir en HH:MM o HH:MM:SS si aparece.
6) currency debe venir normalizada si es evidente:
   VES, USD, EUR, PEN, COP, CLP, MXN, ARS, BRL.
   Si solo existe simbolo y es claro, normalizalo. Si no, null.
7) reference y operationNumber no son obligatoriamente iguales.
8) senderAccount y recipientAccount pueden venir enmascaradas si asi aparecen.
9) notes debe ser un arreglo corto de hallazgos relevantes o ambiguedades.
10) No inventes bancos, cuentas, montos, referencias ni fechas.
""".strip()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        http_method = (
            event.get("requestContext", {}).get("http", {}).get("method")
            or event.get("httpMethod")
            or ""
        ).upper()

        if http_method == "OPTIONS":
            return response(200, {"ok": True})

        payload = parse_event_body(event)
        file_name = payload.get("fileName") or f"receipt-{uuid.uuid4()}"
        mime_type = payload.get("mimeType") or guess_mime_type(file_name)
        file_base64 = payload.get("fileBase64")
        expected = payload.get("expectedData") or {}

        print(json.dumps({
            "stage": "request_received",
            "fileName": file_name,
            "mimeType": mime_type,
            "hasExpectedData": bool(expected),
        }))

        if not file_base64:
            return response(400, {"error": "fileBase64 es requerido"})

        file_bytes = base64.b64decode(file_base64)
        content_block = build_content_block(file_name=file_name, mime_type=mime_type, file_bytes=file_bytes)

        extracted_document, extraction_error = safe_extract_document(content_block)
        normalized_document = normalize_document(extracted_document)
        final_result = build_result(normalized_document, expected, extraction_error)

        validation_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        result_payload = {
            "validationId": validation_id,
            "processedAt": now_iso,
            "status": final_result["status"],
            "documentType": normalized_document["documentType"] or "COMPROBANTE_PAGO",
            "fields": final_result["fields"],
            "issues": final_result["issues"],
            "summary": final_result["summary"],
            "audit": final_result["audit"],
            "expectedData": expected,
            "processingErrors": [extraction_error] if extraction_error else [],
            "extractedDocument": normalized_document,
            "rawExtraction": {
                "document": normalized_document,
            },
        }

        if RESULT_BUCKET:
            storage_info = persist_result_to_s3(
                validation_id=validation_id,
                file_name=file_name,
                mime_type=mime_type,
                file_bytes=file_bytes,
                result_payload=result_payload,
            )
            result_payload["storage"] = storage_info

        return response(200, result_payload)

    except ValueError as error:
        print(json.dumps({"stage": "value_error", "error": str(error)}))
        return response(400, {"error": str(error)})
    except ClientError as error:
        print(json.dumps({"stage": "client_error", "error": str(error)}))
        return response(500, {"error": "Error invocando servicios AWS", "details": str(error)})
    except Exception as error:
        print(json.dumps({
            "stage": "unexpected_error",
            "error": str(error),
            "traceback": traceback.format_exc(),
        }))
        return response(500, {"error": "Error interno inesperado", "details": str(error)})


def parse_event_body(event: Dict[str, Any]) -> Dict[str, Any]:
    body = event.get("body")
    if body is None:
        return event

    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")

    if isinstance(body, str):
        return json.loads(body)

    if isinstance(body, dict):
        return body

    raise ValueError("No se pudo interpretar el body del request")


def guess_mime_type(file_name: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_name)
    return mime_type or "application/octet-stream"


def sanitize_document_name(file_name: str) -> str:
    base = os.path.basename(file_name)
    base = re.sub(r"[^A-Za-z0-9\-\(\)\[\] ]+", " ", base)
    base = re.sub(r"\s+", " ", base).strip()
    return base[:80] or "Documento"


def build_content_block(file_name: str, mime_type: str, file_bytes: bytes) -> Dict[str, Any]:
    if mime_type == "application/pdf":
        return {
            "document": {
                "format": "pdf",
                "name": sanitize_document_name(file_name),
                "source": {"bytes": file_bytes},
            }
        }

    if mime_type in ("image/jpeg", "image/jpg"):
        return {
            "image": {
                "format": "jpeg",
                "source": {"bytes": file_bytes},
            }
        }

    if mime_type == "image/png":
        return {
            "image": {
                "format": "png",
                "source": {"bytes": file_bytes},
            }
        }

    if mime_type == "image/webp":
        return {
            "image": {
                "format": "webp",
                "source": {"bytes": file_bytes},
            }
        }

    raise ValueError(f"Formato no soportado: {mime_type}. Usa PDF, JPG, PNG o WEBP.")


def extract_document(content_block: Dict[str, Any]) -> Dict[str, Any]:
    messages = [
        {
            "role": "user",
            "content": [
                {"text": GENERIC_EXTRACTION_PROMPT},
                content_block,
            ],
        }
    ]

    result = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": "Extrae datos de comprobantes y responde solo JSON valido."}],
        messages=messages,
        inferenceConfig={
            "maxTokens": 1800,
            "temperature": 0,
            "topP": 0.9,
        },
        additionalModelRequestFields={
            "top_k": 50,
        },
    )

    text_output = extract_text_from_converse_response(result)
    return parse_json_from_model(text_output)


def safe_extract_document(content_block: Dict[str, Any]) -> tuple[Dict[str, Any], Optional[str]]:
    try:
        extracted = extract_document(content_block)
        print(json.dumps({"stage": "document_extraction_completed"}))
        return extracted, None
    except Exception as error:
        print(json.dumps({
            "stage": "document_extraction_failed",
            "error": str(error),
            "traceback": traceback.format_exc(),
        }))
        return build_empty_document(), str(error)


def extract_text_from_converse_response(result: Dict[str, Any]) -> str:
    try:
        content = result["output"]["message"]["content"]
        parts = []
        for item in content:
            if "text" in item:
                parts.append(item["text"])
        return "\n".join(parts).strip()
    except Exception as error:
        raise ValueError(f"No se pudo leer la respuesta de Bedrock: {error}")


def parse_json_from_model(text: str) -> Dict[str, Any]:
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"El modelo no devolvio JSON valido. Respuesta: {text[:500]}")


def build_empty_document() -> Dict[str, Any]:
    return {
        "documentType": None,
        "issuerName": None,
        "issuerBankName": None,
        "issuerBankCode": None,
        "senderName": None,
        "senderAccount": None,
        "recipientName": None,
        "recipientAccount": None,
        "destinationBankName": None,
        "destinationBankCode": None,
        "transactionDate": None,
        "transactionTime": None,
        "amount": None,
        "currency": None,
        "reference": None,
        "operationNumber": None,
        "paymentMethod": None,
        "channel": None,
        "countryCode": None,
        "language": None,
        "summary": None,
        "notes": [],
    }


def normalize_document(raw: Dict[str, Any]) -> Dict[str, Any]:
    document = build_empty_document()
    document.update(raw or {})

    return {
        "documentType": normalize_text(document.get("documentType")),
        "issuerName": normalize_text(document.get("issuerName")),
        "issuerBankName": normalize_text(document.get("issuerBankName")),
        "issuerBankCode": normalize_text(document.get("issuerBankCode")),
        "senderName": normalize_text(document.get("senderName")),
        "senderAccount": normalize_text(document.get("senderAccount")),
        "recipientName": normalize_text(document.get("recipientName")),
        "recipientAccount": normalize_text(document.get("recipientAccount")),
        "destinationBankName": normalize_text(document.get("destinationBankName")),
        "destinationBankCode": normalize_text(document.get("destinationBankCode")),
        "transactionDate": normalize_date(document.get("transactionDate")),
        "transactionTime": normalize_time(document.get("transactionTime")),
        "amount": normalize_amount(document.get("amount")),
        "currency": normalize_currency(document.get("currency")),
        "reference": normalize_reference(document.get("reference")),
        "operationNumber": normalize_text(document.get("operationNumber")),
        "paymentMethod": normalize_text(document.get("paymentMethod")),
        "channel": normalize_text(document.get("channel")),
        "countryCode": normalize_country_code(document.get("countryCode")),
        "language": normalize_text(document.get("language")),
        "summary": normalize_text(document.get("summary")),
        "notes": normalize_list(document.get("notes")),
    }


def build_result(document: Dict[str, Any], expected: Dict[str, Any], extraction_error: Optional[str]) -> Dict[str, Any]:
    extracted_core_count = sum(
        1 for value in [
            document.get("amount"),
            document.get("currency"),
            document.get("transactionDate"),
            document.get("reference") or document.get("operationNumber"),
            document.get("senderName") or document.get("issuerName"),
            document.get("recipientName"),
            document.get("issuerBankName"),
            document.get("destinationBankName"),
            document.get("recipientAccount"),
        ] if value not in (None, "", [])
    )

    issues = []

    if extraction_error:
        issues.append("La extraccion IA presento una falla parcial y el documento requiere revision manual.")
    if document.get("amount") is None:
        issues.append("No se detecto un monto confiable.")
    if not document.get("transactionDate"):
        issues.append("No se detecto una fecha confiable.")
    if not document.get("reference") and not document.get("operationNumber"):
        issues.append("No se detecto referencia ni numero de operacion.")
    if not document.get("issuerBankName") and not document.get("destinationBankName"):
        issues.append("No se detectaron bancos de origen o destino.")
    if not document.get("senderName") and not document.get("recipientName") and not document.get("issuerName"):
        issues.append("No se detectaron participantes claros del pago.")

    if extracted_core_count >= 6 and not extraction_error:
        status = "APPROVED"
        summary = document.get("summary") or "Comprobante extraido correctamente."
    elif extracted_core_count >= 3:
        status = "OBSERVED"
        summary = document.get("summary") or "Comprobante extraido parcialmente. Revise los campos detectados."
    else:
        status = "REJECTED"
        summary = "No se pudo extraer suficiente informacion estructurada del comprobante."

    fields = {
        "banco_emisorIA": document.get("issuerBankName"),
        "issuerBankIdIA": document.get("issuerBankCode"),
        "CuentaBancariaIA": document.get("recipientAccount"),
        "banco_destinoIA": document.get("destinationBankName"),
        "fechaIA": document.get("transactionDate"),
        "rawReferenceIA": document.get("operationNumber") or document.get("reference"),
        "CompletereferenciaIA": document.get("reference"),
        "montoIA": document.get("amount"),
        "documentType": document.get("documentType"),
        "issuerName": document.get("issuerName"),
        "senderName": document.get("senderName"),
        "senderAccount": document.get("senderAccount"),
        "recipientName": document.get("recipientName"),
        "recipientAccount": document.get("recipientAccount"),
        "sourceBank": document.get("issuerBankName"),
        "destinationBank": document.get("destinationBankName"),
        "currency": document.get("currency"),
        "operationNumber": document.get("operationNumber"),
        "paymentMethod": document.get("paymentMethod"),
        "channel": document.get("channel"),
        "countryCode": document.get("countryCode"),
    }

    audit = {
        "extraction_model": BEDROCK_MODEL_ID,
        "extraction_strategy": "bedrock_converse_single_pass",
        "extracted_field_count": extracted_core_count,
        "extraction_notes": document.get("notes", []),
    }

    return {
        "status": status,
        "summary": summary,
        "issues": issues,
        "fields": fields,
        "audit": audit,
        "expected": expected,
    }


def normalize_text(value: Any, fallback: Optional[str] = None) -> Optional[str]:
    if value is None:
        return fallback
    text = str(value).strip()
    if not text or text.lower() in {"null", "none", "n/a", "no aplica", "unknown"}:
        return fallback
    return text


def normalize_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def normalize_reference(value: Any) -> Optional[str]:
    text = normalize_text(value)
    if text is None:
        return None
    return text


def normalize_country_code(value: Any) -> Optional[str]:
    text = normalize_text(value)
    if text is None:
        return None
    cleaned = re.sub(r"[^A-Za-z]", "", text).upper()
    if len(cleaned) == 2:
        return cleaned
    return None


def normalize_time(value: Any) -> Optional[str]:
    text = normalize_text(value)
    if text is None:
        return None

    match = re.search(r"\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b", text)
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2))
    second = match.group(3)

    if hour > 23 or minute > 59:
        return None

    if second is not None:
        if int(second) > 59:
            return None
        return f"{hour:02d}:{minute:02d}:{int(second):02d}"

    return f"{hour:02d}:{minute:02d}"


def normalize_date(value: Any) -> Optional[str]:
    text = normalize_text(value)
    if text is None:
        return None

    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text

    candidates = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%Y-%m-%d",
        "%d/%m/%y",
        "%d-%m-%y",
        "%d.%m.%Y",
        "%d.%m.%y",
    ]

    for date_format in candidates:
        try:
            dt = datetime.strptime(text, date_format)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def normalize_currency(value: Any) -> Optional[str]:
    text = normalize_text(value)
    if text is None:
        return None

    upper = text.upper()
    if upper in {"VES", "USD", "EUR", "PEN", "COP", "CLP", "MXN", "ARS", "BRL"}:
        return upper
    if "S/" in text or "SOLES" in upper or "SOL" in upper:
        return "PEN"
    if "$" in text and "US" in upper:
        return "USD"
    return None


def normalize_amount(value: Any) -> Optional[float]:
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    text = (
        text.replace("Bs.", "")
        .replace("Bs", "")
        .replace("USD", "")
        .replace("VES", "")
        .replace("EUR", "")
        .replace("PEN", "")
        .replace("COP", "")
        .replace("CLP", "")
        .replace("MXN", "")
        .replace("ARS", "")
        .replace("BRL", "")
        .replace("S/", "")
        .replace("$", "")
        .strip()
    )

    if text.count(",") > 0 and text.count(".") > 0:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif text.count(",") == 1 and text.count(".") == 0:
        text = text.replace(",", ".")

    text = re.sub(r"[^0-9.\-]", "", text)
    if not text:
        return None

    try:
        return float(Decimal(text))
    except Exception:
        return None


def persist_result_to_s3(
    validation_id: str,
    file_name: str,
    mime_type: str,
    file_bytes: bytes,
    result_payload: Dict[str, Any],
) -> Dict[str, str]:
    ext = os.path.splitext(file_name)[1] or ""
    file_key = f"{RESULT_PREFIX}/{validation_id}/source{ext}"
    json_key = f"{RESULT_PREFIX}/{validation_id}/result.json"

    s3.put_object(
        Bucket=RESULT_BUCKET,
        Key=file_key,
        Body=file_bytes,
        ContentType=mime_type,
    )

    s3.put_object(
        Bucket=RESULT_BUCKET,
        Key=json_key,
        Body=json.dumps(result_payload, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )

    return {
        "bucket": RESULT_BUCKET,
        "sourceKey": file_key,
        "resultKey": json_key,
    }


def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }
