import base64
import boto3
import json
import mimetypes
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional

from botocore.exceptions import ClientError


BEDROCK_REGION = os.getenv("BEDROCK_REGION", os.getenv("AWS_REGION", "us-east-1"))
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-20250514-v1:0")
RESULT_BUCKET = os.getenv("RESULT_BUCKET", "")
RESULT_PREFIX = os.getenv("RESULT_PREFIX", "receipt-validations")

bedrock = boto3.client("bedrock-runtime", region_name=BEDROCK_REGION)
s3 = boto3.client("s3")


MAIN_EXTRACTION_PROMPT = """
Actua como un Sistema de Auditoria y Extraccion de Datos Financieros.
Debes analizar el comprobante venezolano y devolver SOLO JSON valido.
No agregues explicaciones, markdown, ni texto adicional.

OBJETIVO DE SALIDA (EXACTA):
{
  "CuentaBancariaIA": null,
  "banco_destinoIA": null,
  "montoIA": null,
  "fechaIA": null,
  "CompletereferenciaIA": null
}

REGLAS DE EXTRACCION:
1) CuentaBancariaIA:
- Buscar cuenta destino / beneficiario cerca de etiquetas:
  "A la cuenta", "Cuenta abonada", "Cuenta destino", "Beneficiario", "A cuenta", "Destino".
- Ignorar totalmente:
  "Desde mi cuenta", "Cuenta de origen", "Cuenta a debitar", "Ordenante", "Debito".
- Si hay dos cuentas, escoger siempre la que NO es del ordenante.
- Limpiar guiones, asteriscos y espacios.
- Validacion anti-referencia:
  Si es puramente numerica y tiene menos de 20 digitos, NO es cuenta bancaria, devolver null.

2) banco_destinoIA:
- Si CuentaBancariaIA comienza con 0105 => "Mercantil Banco" (exacto).
- Si comienza con 0108 o el destino es Provincial => "Banco Provincial" (exacto).
- Si no se puede determinar con prefijo/texto => null.

3) fechaIA:
- Buscar "Fecha" o "Fecha de la operacion".
- Convertir a YYYY-MM-DD.
- Si la fecha extraida no trae anio visible, usar el anio de $s{FechaProcesamientoIA}.
- No inventar anio si no existe $s{FechaProcesamientoIA}.

4) CompletereferenciaIA:
- Extraer referencia numerica desde etiquetas:
  "Referencia Interbancaria", "Referencia", "Numero de Referencia",
  "Numero de identificacion", "Operacion", "Ref", "N de Recibo", "Documento", "confirmacion".
- Priorizar "Referencia Interbancaria".
- No extraer de Cedula/RIF/ID/Cuenta/campos pagador.
- Si contiene texto descriptivo, descartarlo.
- Si esta partida en lineas o con / o -, concatenar y limpiar todo.
- Salida final: string de digitos.

5) montoIA:
- Buscar "Monto a transferir", "Total" o "Bs.".
- Convertir formato venezolano a float estandar:
  eliminar separador de miles y usar punto decimal.
  Ejemplo: "10.781,00 Bs" => 10781.00.

REGLAS FINALES:
- Si no encuentras un campo, devolver null en ese campo.
- No inventar ni inferir fuera de estas reglas.
""".strip()


ISSUER_EXTRACTION_PROMPT = """
Actua como un Sistema de Auditoria y Extraccion de Datos Financieros.
Tu unica mision es identificar BANCO EMISOR (Origen) del comprobante nacional o internacional.

REGLAS CRITICAS:
- Responder SOLO JSON, sin markdown ni explicaciones.
- Salida en una sola linea.

FORMATO DE SALIDA:
{
  "banco_emisorIA": "string",
  "issuerBankIdIA": "string"
}

ALGORITMO (A->F):
A) PRIORIDAD MAXIMA: cuenta de origen/debito
- Busca "Cuenta de Origen", "Cuenta a Debitar" o "Debito".
- Si el prefijo coincide con codigo bancario, asigna banco y detener.
- Si la cuenta esta oculta o no visible, pasar a B.

B) REGLA MERCANTIL (105) estricta:
- Solo asignar Mercantil si:
  1) referencia empieza en "00255", o
  2) existe check grande con "Listo!".
- Si solo aparece "Mercantil" como destino/beneficiario, NO es emisor.

C) REGLA PROVINCIAL (108):
- Si hay barra/franja azul con dos avatares en encabezado, asignar Provincial.
- O si la fecha viene como dia/mes sin anio (ej: 02 AGO), asignar Provincial.

D) INTERNACIONAL / USD:
- Si detectas Zelle, Mercantil Panama, Banesco Panama, Bank of America, Chase,
  Wells Fargo, PayPal, Binance o banco extranjero:
  banco_emisorIA = entidad exacta detectada
  issuerBankIdIA = "No Aplica"
  detener.

E) IDENTIFICACION VISUAL GENERICA:
- Si fallan A-D, usar solo el header (10% superior) para identificar logo y banco.
- Si hay conflicto entre logo del header y texto del cuerpo, manda logo del header.

F) FALLA NEUTRAL:
- Si no hay certeza, devolver:
  { "banco_emisorIA": "Otros Bancos", "issuerBankIdIA": null }

TABLA DE CODIGOS:
102 Banco de Venezuela
104 Venezolano de Credito
105 Mercantil Banco
108 BBVA Provincial
114 Bancaribe
115 Banco Exterior
128 Banco Caroni
134 Banesco
137 Banco Sofitasa
138 Banco Plaza
146 Bangente C.A
151 BFC Banco Fondo Comun
156 100% Banco
157 DelSur Banco Universal
163 Banco del Tesoro
166 Banco Agricola de Venezuela
168 Bancrecer, Banco Microfinanciero
169 R4, Banco Microfinanciero
171 Banco Activo
172 Bancamiga
173 Banco Internacional de Desarrollo
174 Banplus Banco Universal
175 Banco Digital de Los Trabajadores
177 Banco de la Fuerza Armada Nacional Bolivariana
178 N58 Banco Digital
191 Banco Nacional de Credito
601 Instituto Municipal de Credito Popular
""".strip()


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        payload = parse_event_body(event)

        file_name = payload.get("fileName") or f"comprobante-{uuid.uuid4()}"
        mime_type = payload.get("mimeType") or guess_mime_type(file_name)
        file_base64 = payload.get("fileBase64")
        expected = payload.get("expectedData") or {}

        if not file_base64:
            return response(400, {"error": "fileBase64 es requerido"})

        file_bytes = base64.b64decode(file_base64)
        content_block = build_content_block(file_name=file_name, mime_type=mime_type, file_bytes=file_bytes)

        main_raw = call_bedrock_json(
            system_instruction="Extrae datos con precisión y responde solo JSON válido.",
            user_prompt=MAIN_EXTRACTION_PROMPT,
            content_block=content_block,
        )

        issuer_raw = call_bedrock_json(
            system_instruction="Identifica el banco emisor con precisión y responde solo JSON válido.",
            user_prompt=ISSUER_EXTRACTION_PROMPT,
            content_block=content_block,
        )

        normalized = normalize_result(main_raw, issuer_raw, expected)
        final_result = apply_business_rules(normalized, expected)

        validation_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        result_payload = {
            "validationId": validation_id,
            "processedAt": now_iso,
            "status": final_result["status"],
            "documentType": "COMPROBANTE_PAGO",
            "fields": final_result["fields"],
            "issues": final_result["issues"],
            "summary": final_result["summary"],
            "audit": final_result["audit"],
            "expectedData": expected,
            "rawExtraction": {
                "main": main_raw,
                "issuer": issuer_raw,
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

    except ValueError as e:
        return response(400, {"error": str(e)})
    except ClientError as e:
        return response(500, {"error": "Error invocando servicios AWS", "details": str(e)})
    except Exception as e:
        return response(500, {"error": "Error interno inesperado", "details": str(e)})


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


def call_bedrock_json(system_instruction: str, user_prompt: str, content_block: Dict[str, Any]) -> Dict[str, Any]:
    messages = [
        {
            "role": "user",
            "content": [
                {"text": user_prompt},
                content_block,
            ],
        }
    ]

    result = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": system_instruction}],
        messages=messages,
        inferenceConfig={
            "maxTokens": 1200,
            "temperature": 0,
            "topP": 0.9,
        },
        additionalModelRequestFields={
            "top_k": 50
        },
    )

    text_output = extract_text_from_converse_response(result)
    return parse_json_from_model(text_output)


def extract_text_from_converse_response(result: Dict[str, Any]) -> str:
    try:
        content = result["output"]["message"]["content"]
        parts = []
        for item in content:
            if "text" in item:
                parts.append(item["text"])
        return "\n".join(parts).strip()
    except Exception as e:
        raise ValueError(f"No se pudo leer la respuesta de Bedrock: {e}")


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

    raise ValueError(f"El modelo no devolvió JSON válido. Respuesta: {text[:500]}")


def normalize_result(
    main_raw: Dict[str, Any],
    issuer_raw: Dict[str, Any],
    expected: Dict[str, Any],
) -> Dict[str, Any]:
    raw_reference = normalize_raw_reference(main_raw.get("rawReferenceIA") or main_raw.get("CompletereferenciaIA"))
    normalized_reference = normalize_reference(raw_reference)
    amount = normalize_amount(main_raw.get("montoIA"))
    date_value = normalize_date(main_raw.get("fechaIA"))

    fields = {
        "banco_emisorIA": normalize_text(issuer_raw.get("banco_emisorIA"), fallback="Otros Bancos"),
        "issuerBankIdIA": normalize_text(issuer_raw.get("issuerBankIdIA")),
        "CuentaBancariaIA": normalize_account(main_raw.get("CuentaBancariaIA")),
        "banco_destinoIA": normalize_text(main_raw.get("banco_destinoIA")),
        "fechaIA": date_value,
        "rawReferenceIA": raw_reference,
        "CompletereferenciaIA": normalized_reference,
        "montoIA": amount,
    }

    audit = {
        "main_confidence": normalize_confidence(main_raw.get("confidence")),
        "issuer_confidence": normalize_confidence(issuer_raw.get("confidence")),
        "detection_strategy": normalize_text(issuer_raw.get("detection_strategy"), fallback="unknown"),
        "extraction_notes": normalize_list(main_raw.get("extraction_notes")),
    }

    return {
        "fields": fields,
        "audit": audit,
        "expected": expected,
    }


def apply_business_rules(data: Dict[str, Any], expected: Dict[str, Any]) -> Dict[str, Any]:
    fields = data["fields"]
    audit = data["audit"]
    issues = []

    minimum_required = [
        fields.get("fechaIA"),
        fields.get("CompletereferenciaIA"),
        fields.get("montoIA"),
    ]
    detected_core_count = sum(1 for x in minimum_required if x not in (None, "", []))

    if detected_core_count < 2:
        issues.append("No se detectaron suficientes datos mínimos del comprobante.")

    if not fields.get("banco_emisorIA"):
        issues.append("No fue posible identificar el banco emisor.")
        fields["banco_emisorIA"] = "Otros Bancos"

    if fields.get("montoIA") is None:
        issues.append("No se identificó claramente el monto.")

    if not fields.get("CompletereferenciaIA"):
        issues.append("No se identificó claramente la referencia.")

    if not fields.get("fechaIA"):
        issues.append("No se identificó claramente la fecha del comprobante.")

    expected_amount = normalize_amount(expected.get("montoEsperado"))
    if expected_amount is not None and fields.get("montoIA") is not None:
        if abs(fields["montoIA"] - expected_amount) > 0.01:
            issues.append("El monto detectado no coincide con el monto esperado.")

    expected_ref = normalize_reference(expected.get("referenciaEsperada"))
    if expected_ref and fields.get("CompletereferenciaIA"):
        if fields["CompletereferenciaIA"] != expected_ref:
            issues.append("La referencia detectada no coincide con la referencia esperada.")

    expected_bank = normalize_text(expected.get("bancoEsperado"))
    if expected_bank and fields.get("banco_emisorIA"):
        if normalize_text(fields["banco_emisorIA"]) != expected_bank:
            issues.append("El banco emisor detectado no coincide con el banco esperado.")

    main_conf = audit.get("main_confidence", 0)
    issuer_conf = audit.get("issuer_confidence", 0)

    if not issues and main_conf >= 0.75:
        status = "APPROVED"
        summary = "El comprobante fue extraído correctamente y cumple las validaciones base del MVP."
    elif len(issues) <= 2 and (main_conf >= 0.45 or issuer_conf >= 0.45):
        status = "OBSERVED"
        summary = "El comprobante pudo procesarse, pero requiere revisión de algunos campos."
    else:
        status = "REJECTED"
        summary = "El comprobante no cumple con los criterios mínimos de extracción y validación."

    return {
        "status": status,
        "fields": fields,
        "issues": issues,
        "summary": summary,
        "audit": audit,
    }


def normalize_text(value: Any, fallback: Optional[str] = None) -> Optional[str]:
    if value is None:
        return fallback
    text = str(value).strip()
    if text == "" or text.lower() in {"null", "none", "no aplica", "n/a"}:
        return fallback
    return text


def normalize_list(value: Any) -> list:
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return []


def normalize_account(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = re.sub(r"\D", "", str(value))
    if len(text) < 10:
        return None
    return text


def normalize_raw_reference(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def normalize_reference(value: Any) -> Optional[str]:
    if value is None:
        return None

    digits = re.sub(r"\D", "", str(value))

    if not digits:
        return None

    if len(digits) <= 8:
        return digits

    return digits[-8:]


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
        .replace("$", "")
        .replace("USD", "")
        .replace("VES", "")
        .strip()
    )

    if text.count(",") > 0 and text.count(".") > 0:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    else:
        if text.count(",") == 1 and text.count(".") == 0:
            text = text.replace(",", ".")

    text = re.sub(r"[^0-9.\-]", "", text)
    if not text:
        return None

    try:
        return float(Decimal(text))
    except Exception:
        return None


def normalize_confidence(value: Any) -> float:
    try:
        conf = float(value)
        if conf < 0:
            return 0.0
        if conf > 1:
            return 1.0
        return conf
    except Exception:
        return 0.0


def normalize_date(value: Any) -> Optional[str]:
    if value is None:
        return None

    text = str(value).strip()
    if not text:
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
    ]

    for fmt in candidates:
        try:
            dt = datetime.strptime(text, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return text


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
