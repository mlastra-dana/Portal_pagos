import { validationHistoryMock } from '../data/mockData';
import { fileToBase64 } from './fileToBase64';
import { extractReceiptWithLocalOcr } from './localOcrExtraction';
import type { ExpectedData, ValidationHistoryItem, ValidationResult, ValidationStatus } from '../types/validation';

const API_URL = import.meta.env.VITE_VALIDATE_API_URL as string | undefined;
const VALIDATION_MODE = (import.meta.env.VITE_VALIDATION_MODE as string | undefined)?.toLowerCase();
const USE_REMOTE_API = VALIDATION_MODE === 'api';

const normalizeStatus = (value: unknown): ValidationStatus => {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'APPROVED' || raw === 'APROBADO') return 'APPROVED';
  if (raw === 'OBSERVED' || raw === 'OBSERVADO') return 'OBSERVED';
  if (raw === 'REJECTED' || raw === 'RECHAZADO') return 'REJECTED';
  return 'OBSERVED';
};

const asArrayOfStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const safeRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const normalizeResult = (raw: unknown): ValidationResult => {
  const data = safeRecord(raw);
  const fields = safeRecord(data.fields);

  const validationId = String(data.validationId ?? data.id ?? `VAL-${Date.now()}`);
  const processedAt = String(data.processedAt ?? data.createdAt ?? new Date().toISOString());
  const status = normalizeStatus(data.status);

  return {
    validationId,
    processedAt,
    status,
    documentType: String(data.documentType ?? data.document_type ?? 'Comprobante de pago'),
    summary: String(data.summary ?? data.message ?? 'Resultado de validación procesado correctamente.'),
    issues: asArrayOfStrings(data.issues),
    fields: {
      banco_emisorIA: (fields.banco_emisorIA as string | null | undefined) ?? null,
      issuerBankIdIA: (fields.issuerBankIdIA as string | null | undefined) ?? null,
      CuentaBancariaIA: (fields.CuentaBancariaIA as string | null | undefined) ?? null,
      banco_destinoIA: (fields.banco_destinoIA as string | null | undefined) ?? null,
      fechaIA: (fields.fechaIA as string | null | undefined) ?? null,
      rawReferenceIA: (fields.rawReferenceIA as string | null | undefined) ?? null,
      CompletereferenciaIA: (fields.CompletereferenciaIA as string | null | undefined) ?? null,
      montoIA: (fields.montoIA as number | null | undefined) ?? null,
    },
    audit: data.audit as ValidationResult['audit'] | undefined,
    expectedData: data.expectedData as ValidationResult['expectedData'] | undefined,
    rawExtraction: data.rawExtraction as ValidationResult['rawExtraction'] | undefined,
    storage: data.storage as ValidationResult['storage'] | undefined,
  };
};

const normalizeReference = (value: string | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return digits.length <= 8 ? digits : digits.slice(-8);
};

const simulateLocalValidation = async (file: File, expectedData?: ExpectedData): Promise<ValidationResult> => {
  const localExtraction = await extractReceiptWithLocalOcr(file);
  const extracted = localExtraction.fields;

  const rawReference = extracted.rawReferenceIA ?? extracted.CompletereferenciaIA ?? null;
  const completeReference = normalizeReference(rawReference ?? undefined);
  const montoIA = extracted.montoIA ?? null;
  const fechaIA = extracted.fechaIA ?? null;
  const CuentaBancariaIA = extracted.CuentaBancariaIA ?? null;

  const issues: string[] = [];

  if (!fechaIA) {
    issues.push('No se pudo extraer fecha de forma confiable.');
  }
  if (!completeReference) {
    issues.push('No se pudo extraer la referencia completa.');
  }
  if (!CuentaBancariaIA) {
    issues.push('No se pudo extraer la cuenta destino.');
  }

  const status: ValidationStatus = issues.length === 0 ? 'APPROVED' : issues.length <= 2 ? 'OBSERVED' : 'REJECTED';
  const summaryByStatus: Record<ValidationStatus, string> = {
    APPROVED: 'Pago validado correctamente.',
    OBSERVED: 'Pago en revisión.',
    REJECTED: 'Pago rechazado.',
  };

  return {
    validationId: `LOCAL-${Date.now()}`,
    processedAt: new Date().toISOString(),
    status,
    documentType: file.type === 'application/pdf' ? 'Comprobante PDF' : 'Comprobante imagen',
    summary: summaryByStatus[status],
    issues,
    fields: {
      banco_emisorIA: extracted.banco_emisorIA ?? null,
      issuerBankIdIA: extracted.issuerBankIdIA ?? null,
      CuentaBancariaIA,
      banco_destinoIA: extracted.banco_destinoIA ?? null,
      fechaIA,
      rawReferenceIA: rawReference,
      CompletereferenciaIA: completeReference,
      montoIA,
    },
    audit: {
      main_confidence: localExtraction.confidence,
      issuer_confidence: localExtraction.confidence,
      detection_strategy: localExtraction.detectionStrategy,
      extraction_notes: localExtraction.notes,
    },
    expectedData,
    rawExtraction: {
      main: {
        CuentaBancariaIA,
        banco_destinoIA: extracted.banco_destinoIA ?? null,
        fechaIA,
        rawReferenceIA: rawReference,
        montoIA,
        confidence: localExtraction.confidence,
        extraction_notes: localExtraction.notes,
      },
      issuer: {
        banco_emisorIA: extracted.banco_emisorIA ?? 'Otros Bancos',
        issuerBankIdIA: extracted.issuerBankIdIA ?? null,
        confidence: localExtraction.confidence,
        detection_strategy: localExtraction.detectionStrategy,
      },
    },
  };
};

export const validateReceipt = async (file: File, expectedData?: ExpectedData): Promise<ValidationResult> => {
  if (!USE_REMOTE_API) {
    return simulateLocalValidation(file, expectedData);
  }

  if (!API_URL) {
    throw new Error('No se configuró VITE_VALIDATE_API_URL en el entorno.');
  }

  const fileBase64 = await fileToBase64(file);
  const payload = {
    fileName: file.name,
    mimeType: file.type,
    fileBase64,
    expectedData: {
      nombreDepositante: expectedData?.nombreDepositante || undefined,
      cedulaDepositante: expectedData?.cedulaDepositante || undefined,
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errData = safeRecord(data);
    throw new Error(
      String(errData.details ?? errData.error ?? errData.message ?? 'Error validando comprobante'),
    );
  }

  return normalizeResult(data);
};

export const getValidationHistory = async (): Promise<ValidationHistoryItem[]> => {
  return validationHistoryMock;
};
