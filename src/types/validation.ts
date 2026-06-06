export type ValidationStatus = 'APPROVED' | 'OBSERVED' | 'REJECTED';
export type DocumentCategory = 'BANK_TRANSFER' | 'DIGITAL_WALLET';
export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'UNKNOWN';

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export interface ExpectedData {
  nombreDepositante?: string;
  cedulaDepositante?: string;
}

export interface ValidationFields {
  documentType?: string | null;
  issuerName?: string | null;
  recipientName?: string | null;
  sourceBank?: string | null;
  destinationBank?: string | null;
  recipientAccount?: string | null;
  amount?: number | null;
  currency?: string | null;
  transactionDate?: string | null;
  reference?: string | null;
  operationNumber?: string | null;
  banco_emisorIA?: string | null;
  issuerBankIdIA?: string | null;
  CuentaBancariaIA?: string | null;
  banco_destinoIA?: string | null;
  fechaIA?: string | null;
  rawReferenceIA?: string | null;
  CompletereferenciaIA?: string | null;
  montoIA?: number | null;
  senderName?: string | null;
  senderAccount?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: PaymentStatus | null;
  concept?: string | null;
  channel?: string | null;
  countryCode?: string | null;
}

export interface ValidationAudit {
  main_confidence?: number;
  issuer_confidence?: number;
  detection_strategy?: string;
  extraction_model?: string;
  extraction_strategy?: string;
  extracted_field_count?: number;
  extraction_notes?: string[];
}

export interface ExtractedDocument {
  documentType?: string | null;
  issuerName?: string | null;
  issuerBankName?: string | null;
  issuerBankCode?: string | null;
  senderName?: string | null;
  senderAccount?: string | null;
  recipientName?: string | null;
  recipientAccount?: string | null;
  destinationBankName?: string | null;
  destinationBankCode?: string | null;
  transactionDate?: string | null;
  transactionTime?: string | null;
  amount?: number | null;
  currency?: string | null;
  reference?: string | null;
  operationNumber?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: PaymentStatus | null;
  concept?: string | null;
  channel?: string | null;
  countryCode?: string | null;
  language?: string | null;
  summary?: string | null;
  notes?: string[];
}

export interface ValidationResult {
  validationId: string;
  processedAt: string;
  status: ValidationStatus;
  documentCategory: DocumentCategory;
  documentType: string;
  fields: ValidationFields;
  issues: string[];
  missingRequiredFields?: string[];
  summary: string;
  audit?: ValidationAudit;
  expectedData?: ExpectedData;
  processingErrors?: string[];
  extractedDocument?: ExtractedDocument;
  rawExtraction?: {
    document?: ExtractedDocument;
  };
  storage?: {
    bucket?: string;
    sourceKey?: string;
    resultKey?: string;
  };
}
