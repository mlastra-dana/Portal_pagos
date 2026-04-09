import { fileToBase64 } from './fileToBase64';
import type { ExpectedData, ExtractedDocument, ValidationResult, ValidationStatus } from '../types/validation';

const LAMBDA_FUNCTION_URL =
  (import.meta.env.VITE_LAMBDA_FUNCTION_URL as string | undefined)
  ?? (import.meta.env.VITE_VALIDATE_API_URL as string | undefined);

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
  const extractedDocument = safeRecord(data.extractedDocument);

  const validationId = String(data.validationId ?? data.id ?? `VAL-${Date.now()}`);
  const processedAt = String(data.processedAt ?? data.createdAt ?? new Date().toISOString());
  const status = normalizeStatus(data.status);

  const normalizedDocument: ExtractedDocument = {
    documentType: (extractedDocument.documentType as string | null | undefined) ?? null,
    issuerName: (extractedDocument.issuerName as string | null | undefined) ?? null,
    issuerBankName: (extractedDocument.issuerBankName as string | null | undefined) ?? null,
    issuerBankCode: (extractedDocument.issuerBankCode as string | null | undefined) ?? null,
    senderName: (extractedDocument.senderName as string | null | undefined) ?? null,
    senderAccount: (extractedDocument.senderAccount as string | null | undefined) ?? null,
    recipientName: (extractedDocument.recipientName as string | null | undefined) ?? null,
    recipientAccount: (extractedDocument.recipientAccount as string | null | undefined) ?? null,
    destinationBankName: (extractedDocument.destinationBankName as string | null | undefined) ?? null,
    destinationBankCode: (extractedDocument.destinationBankCode as string | null | undefined) ?? null,
    transactionDate: (extractedDocument.transactionDate as string | null | undefined) ?? null,
    transactionTime: (extractedDocument.transactionTime as string | null | undefined) ?? null,
    amount: (extractedDocument.amount as number | null | undefined) ?? null,
    currency: (extractedDocument.currency as string | null | undefined) ?? null,
    reference: (extractedDocument.reference as string | null | undefined) ?? null,
    operationNumber: (extractedDocument.operationNumber as string | null | undefined) ?? null,
    paymentMethod: (extractedDocument.paymentMethod as string | null | undefined) ?? null,
    channel: (extractedDocument.channel as string | null | undefined) ?? null,
    countryCode: (extractedDocument.countryCode as string | null | undefined) ?? null,
    language: (extractedDocument.language as string | null | undefined) ?? null,
    summary: (extractedDocument.summary as string | null | undefined) ?? null,
    notes: asArrayOfStrings(extractedDocument.notes),
  };

  const normalizedDocumentType =
    (fields.documentType as string | null | undefined)
    ?? normalizedDocument.documentType
    ?? null;
  const normalizedIssuerName =
    (fields.issuerName as string | null | undefined)
    ?? normalizedDocument.issuerName
    ?? null;
  const normalizedRecipientName =
    (fields.recipientName as string | null | undefined)
    ?? normalizedDocument.recipientName
    ?? null;
  const normalizedSourceBank =
    (fields.sourceBank as string | null | undefined)
    ?? normalizedDocument.issuerBankName
    ?? null;
  const normalizedDestinationBank =
    (fields.destinationBank as string | null | undefined)
    ?? normalizedDocument.destinationBankName
    ?? null;
  const normalizedRecipientAccount =
    (fields.recipientAccount as string | null | undefined)
    ?? normalizedDocument.recipientAccount
    ?? null;
  const normalizedAmount =
    (fields.amount as number | null | undefined)
    ?? (fields.montoIA as number | null | undefined)
    ?? normalizedDocument.amount
    ?? null;
  const normalizedCurrency =
    (fields.currency as string | null | undefined)
    ?? normalizedDocument.currency
    ?? null;
  const normalizedTransactionDate =
    (fields.transactionDate as string | null | undefined)
    ?? (fields.fechaIA as string | null | undefined)
    ?? normalizedDocument.transactionDate
    ?? null;
  const normalizedReference =
    (fields.reference as string | null | undefined)
    ?? (fields.CompletereferenciaIA as string | null | undefined)
    ?? normalizedDocument.reference
    ?? null;
  const normalizedOperationNumber =
    (fields.operationNumber as string | null | undefined)
    ?? (fields.rawReferenceIA as string | null | undefined)
    ?? normalizedDocument.operationNumber
    ?? null;

  return {
    validationId,
    processedAt,
    status,
    documentType: String(data.documentType ?? data.document_type ?? 'Comprobante de pago'),
    summary: String(data.summary ?? data.message ?? 'Resultado de validación procesado correctamente.'),
    issues: asArrayOfStrings(data.issues),
    fields: {
      documentType: normalizedDocumentType,
      issuerName: normalizedIssuerName,
      recipientName: normalizedRecipientName,
      sourceBank: normalizedSourceBank,
      destinationBank: normalizedDestinationBank,
      recipientAccount: normalizedRecipientAccount,
      amount: normalizedAmount,
      currency: normalizedCurrency,
      transactionDate: normalizedTransactionDate,
      reference: normalizedReference,
      operationNumber: normalizedOperationNumber,
      banco_emisorIA: (fields.banco_emisorIA as string | null | undefined) ?? normalizedSourceBank,
      issuerBankIdIA: (fields.issuerBankIdIA as string | null | undefined) ?? null,
      CuentaBancariaIA: (fields.CuentaBancariaIA as string | null | undefined) ?? normalizedRecipientAccount,
      banco_destinoIA: (fields.banco_destinoIA as string | null | undefined) ?? normalizedDestinationBank,
      fechaIA: normalizedTransactionDate,
      rawReferenceIA: (fields.rawReferenceIA as string | null | undefined) ?? normalizedOperationNumber,
      CompletereferenciaIA: (fields.CompletereferenciaIA as string | null | undefined) ?? normalizedReference,
      montoIA: (fields.montoIA as number | null | undefined) ?? normalizedAmount,
      senderName: (fields.senderName as string | null | undefined) ?? normalizedDocument.senderName ?? null,
      senderAccount: (fields.senderAccount as string | null | undefined) ?? normalizedDocument.senderAccount ?? null,
      paymentMethod: (fields.paymentMethod as string | null | undefined) ?? normalizedDocument.paymentMethod ?? null,
      channel: (fields.channel as string | null | undefined) ?? normalizedDocument.channel ?? null,
      countryCode: (fields.countryCode as string | null | undefined) ?? normalizedDocument.countryCode ?? null,
    },
    audit: data.audit as ValidationResult['audit'] | undefined,
    expectedData: data.expectedData as ValidationResult['expectedData'] | undefined,
    processingErrors: asArrayOfStrings(data.processingErrors),
    extractedDocument: normalizedDocument,
    rawExtraction: data.rawExtraction as ValidationResult['rawExtraction'] | undefined,
    storage: data.storage as ValidationResult['storage'] | undefined,
  };
};

export const validateReceipt = async (file: File, expectedData?: ExpectedData): Promise<ValidationResult> => {
  if (!LAMBDA_FUNCTION_URL) {
    throw new Error('No se configuró VITE_LAMBDA_FUNCTION_URL en el entorno.');
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

  const response = await fetch(LAMBDA_FUNCTION_URL, {
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
