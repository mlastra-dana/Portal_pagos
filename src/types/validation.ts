export type ValidationStatus = 'APPROVED' | 'OBSERVED' | 'REJECTED';

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
  banco_emisorIA?: string | null;
  issuerBankIdIA?: string | null;
  CuentaBancariaIA?: string | null;
  banco_destinoIA?: string | null;
  fechaIA?: string | null;
  rawReferenceIA?: string | null;
  CompletereferenciaIA?: string | null;
  montoIA?: number | null;
}

export interface ValidationAudit {
  main_confidence?: number;
  issuer_confidence?: number;
  detection_strategy?: string;
  extraction_notes?: string[];
}

export interface RawMainExtraction {
  CuentaBancariaIA?: string | null;
  banco_destinoIA?: string | null;
  fechaIA?: string | null;
  rawReferenceIA?: string | null;
  montoIA?: number | null;
  confidence?: number;
  extraction_notes?: string[];
}

export interface RawIssuerExtraction {
  banco_emisorIA?: string;
  issuerBankIdIA?: string | null;
  confidence?: number;
  detection_strategy?: string;
}

export interface ValidationResult {
  validationId: string;
  processedAt: string;
  status: ValidationStatus;
  documentType: string;
  fields: ValidationFields;
  issues: string[];
  summary: string;
  audit?: ValidationAudit;
  expectedData?: ExpectedData;
  rawExtraction?: {
    main?: RawMainExtraction;
    issuer?: RawIssuerExtraction;
  };
  storage?: {
    bucket?: string;
    sourceKey?: string;
    resultKey?: string;
  };
}

export interface ValidationHistoryItem {
  id: string;
  createdAt: string;
  fileName: string;
  status: ValidationStatus;
}
