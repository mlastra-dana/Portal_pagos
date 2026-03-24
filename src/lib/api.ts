import { validationHistoryMock } from '../data/mockData';
import { fileToBase64 } from './fileToBase64';
import type { ExpectedData, ValidationHistoryItem, ValidationResult, ValidationStatus } from '../types/validation';

const API_URL = import.meta.env.VITE_VALIDATE_API_URL as string | undefined;

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

export const validateReceipt = async (file: File, expectedData?: ExpectedData): Promise<ValidationResult> => {
  if (!API_URL) {
    throw new Error('No se configuró VITE_VALIDATE_API_URL en el entorno.');
  }

  const fileBase64 = await fileToBase64(file);
  const payload = {
    fileName: file.name,
    mimeType: file.type,
    fileBase64,
    expectedData: {
      montoEsperado: expectedData?.montoEsperado || undefined,
      referenciaEsperada: expectedData?.referenciaEsperada || undefined,
      bancoEsperado: expectedData?.bancoEsperado || undefined,
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
