import { validationHistoryMock } from '../data/mockData';
import { fileToBase64 } from './fileToBase64';
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeReference = (value: string | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  return digits.length <= 8 ? digits : digits.slice(-8);
};

const normalizeAmount = (value: string | undefined): number | null => {
  if (!value) return null;

  let text = value
    .replace(/bs\.?/gi, '')
    .replace(/usd/gi, '')
    .replace(/\$/g, '')
    .trim();

  if (text.includes(',') && text.includes('.')) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else if (text.includes(',') && !text.includes('.')) {
    text = text.replace(',', '.');
  }

  const parsed = Number(text.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const bankCatalog: Array<{ keywords: string[]; name: string; code: string | null }> = [
  { keywords: ['banesco'], name: 'Banesco', code: '0134' },
  { keywords: ['mercantil'], name: 'Banco Mercantil', code: '0105' },
  { keywords: ['provincial', 'bbva'], name: 'BBVA Provincial', code: '0108' },
  { keywords: ['venezuela', 'bdv'], name: 'Banco de Venezuela', code: '0102' },
  { keywords: ['bancamiga'], name: 'Bancamiga', code: '0172' },
  { keywords: ['tesoro'], name: 'Banco del Tesoro', code: '0163' },
];

const inferBank = (text: string): { name: string; code: string | null } => {
  const found = bankCatalog.find((entry) => entry.keywords.some((keyword) => text.includes(keyword)));
  return found ?? { name: 'Otros Bancos', code: null };
};

const extractReferenceCandidate = (text: string): string | null => {
  const matches = text.match(/\d{6,}/g);
  if (!matches || matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
};

const extractDateCandidate = (text: string): string | null => {
  const direct = text.match(/\b(20\d{2})[-_/.](0?[1-9]|1[0-2])[-_/.](0?[1-9]|[12]\d|3[01])\b/);
  if (direct) {
    const year = direct[1];
    const month = direct[2].padStart(2, '0');
    const day = direct[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const reverse = text.match(/\b(0?[1-9]|[12]\d|3[01])[-_/.](0?[1-9]|1[0-2])[-_/.](20\d{2})\b/);
  if (!reverse) return null;

  const day = reverse[1].padStart(2, '0');
  const month = reverse[2].padStart(2, '0');
  const year = reverse[3];
  return `${year}-${month}-${day}`;
};

const extractAmountCandidate = (text: string): number | null => {
  const matches = text.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{1,2})/g);
  if (!matches || matches.length === 0) return null;

  const numericCandidates = matches
    .map((candidate) => normalizeAmount(candidate))
    .filter((candidate): candidate is number => candidate !== null);

  if (numericCandidates.length === 0) return null;
  return numericCandidates.sort((a, b) => b - a)[0];
};

const toSeed = (text: string): number => {
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) % 1_000_000_007;
  }
  return seed;
};

const seedDigits = (seed: number, size: number): string => {
  let value = seed;
  let result = '';
  for (let index = 0; index < size; index += 1) {
    value = (value * 1103515245 + 12345) % 2147483648;
    result += String(value % 10);
  }
  return result;
};

const simulateLocalValidation = async (file: File, expectedData?: ExpectedData): Promise<ValidationResult> => {
  await sleep(900);

  const cleanName = file.name.toLowerCase().replace(/\.[a-z0-9]+$/i, '');
  const inferredBank = inferBank(cleanName);
  const seed = toSeed(file.name);

  const rawReference = extractReferenceCandidate(cleanName) ?? seedDigits(seed, 10);
  const completeReference = normalizeReference(rawReference);

  const amountFromName = extractAmountCandidate(cleanName);
  const expectedAmount = normalizeAmount(expectedData?.montoEsperado);
  const montoIA = amountFromName ?? expectedAmount ?? Number(`1${seedDigits(seed, 3)}.${seedDigits(seed + 3, 2)}`);

  const fechaIA = extractDateCandidate(cleanName) ?? new Date().toISOString().slice(0, 10);

  const accountFromName = cleanName.match(/\d{20}/)?.[0] ?? null;
  const CuentaBancariaIA = accountFromName ?? `01${seedDigits(seed + 11, 18)}`;

  const expectedReference = normalizeReference(expectedData?.referenciaEsperada);
  const expectedBank = expectedData?.bancoEsperado?.trim();

  const issues: string[] = [];

  if (!extractDateCandidate(cleanName)) {
    issues.push('Fecha inferida automáticamente por modo local (no OCR real).');
  }
  if (!extractReferenceCandidate(cleanName)) {
    issues.push('Referencia inferida automáticamente por modo local (no OCR real).');
  }

  if (expectedAmount !== null && Math.abs(montoIA - expectedAmount) > 0.01) {
    issues.push('El monto detectado no coincide con el monto esperado.');
  }
  if (expectedReference && completeReference && completeReference !== expectedReference) {
    issues.push('La referencia detectada no coincide con la referencia esperada.');
  }
  if (expectedBank && inferredBank.name.toLowerCase() !== expectedBank.toLowerCase()) {
    issues.push('El banco emisor detectado no coincide con el banco esperado.');
  }

  const status: ValidationStatus = issues.length === 0 ? 'APPROVED' : issues.length <= 2 ? 'OBSERVED' : 'REJECTED';
  const summaryByStatus: Record<ValidationStatus, string> = {
    APPROVED: 'Extracción local completada. Los campos son consistentes con la información esperada.',
    OBSERVED: 'Extracción local completada con observaciones. Revise los campos marcados.',
    REJECTED: 'Extracción local incompleta. El comprobante requiere revisión manual.',
  };

  return {
    validationId: `LOCAL-${Date.now()}`,
    processedAt: new Date().toISOString(),
    status,
    documentType: file.type === 'application/pdf' ? 'Comprobante PDF' : 'Comprobante imagen',
    summary: summaryByStatus[status],
    issues,
    fields: {
      banco_emisorIA: inferredBank.name,
      issuerBankIdIA: inferredBank.code,
      CuentaBancariaIA,
      banco_destinoIA: expectedBank ?? inferredBank.name,
      fechaIA,
      rawReferenceIA: rawReference,
      CompletereferenciaIA: completeReference,
      montoIA,
    },
    audit: {
      main_confidence: 0.62,
      issuer_confidence: 0.6,
      detection_strategy: 'local_filename_heuristics',
      extraction_notes: [
        'Modo local activo: no se invocó Lambda ni OCR.',
        'Los valores se infieren con heurísticas de nombre de archivo y datos esperados.',
      ],
    },
    expectedData,
    rawExtraction: {
      main: {
        CuentaBancariaIA,
        banco_destinoIA: expectedBank ?? inferredBank.name,
        fechaIA,
        rawReferenceIA: rawReference,
        montoIA,
        confidence: 0.62,
        extraction_notes: ['Simulación local para revisión de interfaz.'],
      },
      issuer: {
        banco_emisorIA: inferredBank.name,
        issuerBankIdIA: inferredBank.code,
        confidence: 0.6,
        detection_strategy: 'local_filename_heuristics',
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
