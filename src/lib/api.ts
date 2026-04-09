import { fileToBase64 } from './fileToBase64';
import type { DocumentCategory, ExpectedData, ExtractedDocument, ValidationResult, ValidationStatus } from '../types/validation';

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

const normalizeTextValue = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const looksLikeSourceDescriptor = (value: string | null | undefined): boolean => {
  const text = normalizeTextValue(value);
  if (!text) return false;
  return /[a-z]/i.test(text);
};

const inferPaymentRailBrand = (fields: Array<string | null | undefined>): string | null => {
  const combined = fields.filter(Boolean).join(' ').toLowerCase();

  if (combined.includes('zinli')) return 'Zinli';
  if (combined.includes('zelle')) return 'Zelle';
  if (combined.includes('paypal')) return 'PayPal';
  if (combined.includes('wise')) return 'Wise';
  if (combined.includes('airtm')) return 'Airtm';
  if (combined.includes('binance')) return 'Binance';

  return null;
};

const classifyDocumentCategory = (fields: {
  documentType?: string | null;
  paymentMethod?: string | null;
  channel?: string | null;
  recipientAccount?: string | null;
  CuentaBancariaIA?: string | null;
  recipientName?: string | null;
  sourceBank?: string | null;
  destinationBank?: string | null;
  banco_emisorIA?: string | null;
  banco_destinoIA?: string | null;
  currency?: string | null;
  reference?: string | null;
  CompletereferenciaIA?: string | null;
  rawReferenceIA?: string | null;
  operationNumber?: string | null;
}): DocumentCategory => {
  return isAlternativePaymentRail(fields) ? 'DIGITAL_WALLET' : 'BANK_TRANSFER';
};

const getMissingRequiredFields = (fields: {
  documentCategory?: DocumentCategory;
  recipientAccount?: string | null;
  CuentaBancariaIA?: string | null;
  recipientName?: string | null;
  transactionDate?: string | null;
  fechaIA?: string | null;
  amount?: number | null;
  montoIA?: number | null;
  reference?: string | null;
  CompletereferenciaIA?: string | null;
  rawReferenceIA?: string | null;
  operationNumber?: string | null;
}): string[] => {
  const missing: string[] = [];
  const category = fields.documentCategory ?? 'BANK_TRANSFER';

  const hasDestinationIdentifier = category === 'DIGITAL_WALLET'
    ? Boolean(fields.recipientAccount ?? fields.CuentaBancariaIA ?? fields.recipientName)
    : Boolean(fields.recipientAccount ?? fields.CuentaBancariaIA);
  const hasDate = Boolean(fields.transactionDate ?? fields.fechaIA);
  const hasAmount = (fields.amount ?? fields.montoIA) != null;
  const hasReference = Boolean(
    fields.reference
    ?? fields.CompletereferenciaIA
    ?? fields.rawReferenceIA
    ?? fields.operationNumber,
  );

  if (!hasDate) missing.push('fecha');
  if (!hasAmount) missing.push('monto');
  if (!hasReference) missing.push('referencia');
  if (!hasDestinationIdentifier) {
    missing.push(category === 'DIGITAL_WALLET' ? 'destino' : 'cuenta destino');
  }

  return missing;
};

const isAlternativePaymentRail = (fields: {
  documentType?: string | null;
  paymentMethod?: string | null;
  channel?: string | null;
  recipientAccount?: string | null;
  CuentaBancariaIA?: string | null;
  recipientName?: string | null;
  sourceBank?: string | null;
  destinationBank?: string | null;
  banco_emisorIA?: string | null;
  banco_destinoIA?: string | null;
  currency?: string | null;
  reference?: string | null;
  CompletereferenciaIA?: string | null;
  rawReferenceIA?: string | null;
  operationNumber?: string | null;
}): boolean => {
  const combined = [
    fields.documentType,
    fields.paymentMethod,
    fields.channel,
    fields.recipientAccount,
    fields.CuentaBancariaIA,
    fields.recipientName,
    fields.sourceBank,
    fields.destinationBank,
    fields.banco_emisorIA,
    fields.banco_destinoIA,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(zelle|zinli|paypal|wise|airtm|binance|wallet|billetera)/.test(combined)) {
    return true;
  }

  const hasUsd = String(fields.currency ?? '').trim().toUpperCase() === 'USD';
  const hasReference = Boolean(fields.reference ?? fields.CompletereferenciaIA ?? fields.rawReferenceIA ?? fields.operationNumber);
  const hasRecipient = Boolean(fields.recipientName);
  const hasAnyBank = Boolean(fields.sourceBank ?? fields.destinationBank ?? fields.banco_emisorIA ?? fields.banco_destinoIA);
  const hasTraditionalAccount = Boolean(fields.recipientAccount ?? fields.CuentaBancariaIA);

  if (hasUsd && hasReference && hasRecipient && hasAnyBank && !hasTraditionalAccount) {
    return true;
  }

  return false;
};

const getMissingComplementaryFields = (fields: {
  documentCategory?: DocumentCategory;
  documentType?: string | null;
  paymentMethod?: string | null;
  channel?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  CuentaBancariaIA?: string | null;
  sourceBank?: string | null;
  banco_emisorIA?: string | null;
  destinationBank?: string | null;
  banco_destinoIA?: string | null;
  currency?: string | null;
}): string[] => {
  const missing: string[] = [];
  const category = fields.documentCategory ?? classifyDocumentCategory(fields);

  const hasRecipient = Boolean(fields.recipientName);
  const hasSourceBank = Boolean(fields.sourceBank ?? fields.banco_emisorIA);
  const hasDestinationBank = Boolean(fields.destinationBank ?? fields.banco_destinoIA);
  const hasCurrency = Boolean(fields.currency);

  if (!hasRecipient) missing.push('beneficiario');
  if (category === 'BANK_TRANSFER') {
    if (!hasSourceBank) missing.push('banco origen');
    if (!hasDestinationBank) missing.push('banco destino');
  } else {
    if (!hasSourceBank) missing.push('origen del pago');
  }
  if (!hasCurrency) missing.push('moneda');

  return missing;
};

const dedupeIssues = (issues: string[]): string[] => {
  const seen = new Set<string>();
  const normalized = issues
    .map((issue) => issue.trim())
    .filter((issue) => issue.length > 0)
    .filter((issue) => {
      const key = issue.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return normalized;
};

const normalizeResult = (raw: unknown): ValidationResult => {
  const data = safeRecord(raw);
  const fields = safeRecord(data.fields);
  const extractedDocument = safeRecord(data.extractedDocument);

  const validationId = String(data.validationId ?? data.id ?? `VAL-${Date.now()}`);
  const processedAt = String(data.processedAt ?? data.createdAt ?? new Date().toISOString());
  const lambdaStatus = normalizeStatus(data.status);

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
  const inferredRailBrand = inferPaymentRailBrand([
    normalizedDocumentType,
    normalizedDocument.paymentMethod,
    normalizedDocument.channel,
    normalizedDocument.recipientAccount,
    (fields.recipientAccount as string | null | undefined),
    (fields.CuentaBancariaIA as string | null | undefined),
    (fields.reference as string | null | undefined),
    (fields.rawReferenceIA as string | null | undefined),
  ]);
  const inferredSourceDescriptor =
    normalizeTextValue(normalizedDocument.issuerBankName)
    ?? (
      looksLikeSourceDescriptor(normalizedDocument.senderAccount)
        ? normalizeTextValue(normalizedDocument.senderAccount)
        : null
    )
    ?? (
      looksLikeSourceDescriptor(normalizedDocument.senderName)
        ? normalizeTextValue(normalizedDocument.senderName)
        : null
    )
    ?? inferredRailBrand;
  const normalizedSourceBank =
    (fields.sourceBank as string | null | undefined)
    ?? inferredSourceDescriptor
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

  const normalizedFields = {
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
  };
  const documentCategory = classifyDocumentCategory(normalizedFields);
  const categorizedFields = {
    ...normalizedFields,
    documentCategory,
  };

  const rawIssues = asArrayOfStrings(data.issues);
  const processingErrors = asArrayOfStrings(data.processingErrors);
  const missingRequiredFields = getMissingRequiredFields(categorizedFields);
  const missingComplementaryFields = getMissingComplementaryFields(categorizedFields);
  const isAlternativeRail = documentCategory === 'DIGITAL_WALLET';
  const status: ValidationStatus =
    missingRequiredFields.length > 0
      ? 'REJECTED'
      : missingComplementaryFields.length > 0 || rawIssues.length > 0 || processingErrors.length > 0 || lambdaStatus === 'OBSERVED'
        ? 'OBSERVED'
        : 'APPROVED';

  const issues = [...rawIssues];
  if (missingRequiredFields.length > 0) {
    issues.unshift(`Faltan datos obligatorios para validar la transferencia: ${missingRequiredFields.join(', ')}.`);
  } else if (missingComplementaryFields.length > 0) {
    issues.unshift(`Faltan datos complementarios: ${missingComplementaryFields.join(', ')}.`);
  }

  const filteredIssues = issues.filter((issue) => {
    const lower = issue.toLowerCase();

    if (missingComplementaryFields.length > 0 && lower.includes('no se detectaron bancos de origen o destino')) {
      return false;
    }

    if (missingRequiredFields.length > 0 && lower.includes('no se detecto referencia ni numero de operacion')) {
      return false;
    }

    if (isAlternativeRail && (lower.includes('banco origen') || lower.includes('banco destino'))) {
      return false;
    }

    return true;
  });

  const summary =
    missingRequiredFields.length > 0
      ? 'Faltan datos obligatorios del comprobante para continuar.'
      : missingComplementaryFields.length > 0
        ? 'Comprobante procesado con datos obligatorios completos y observaciones complementarias.'
        : status === 'APPROVED'
          ? 'Comprobante procesado. Se detectaron todos los datos principales.'
          : status === 'OBSERVED'
            ? String(data.summary ?? data.message ?? 'Comprobante procesado con observaciones.')
            : String(data.summary ?? data.message ?? 'Comprobante procesado correctamente.');

  return {
    validationId,
    processedAt,
    status,
    documentCategory,
    documentType: String(data.documentType ?? data.document_type ?? 'Comprobante de pago'),
    summary,
    issues: dedupeIssues(filteredIssues),
    missingRequiredFields,
    fields: normalizedFields,
    audit: data.audit as ValidationResult['audit'] | undefined,
    expectedData: data.expectedData as ValidationResult['expectedData'] | undefined,
    processingErrors,
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
