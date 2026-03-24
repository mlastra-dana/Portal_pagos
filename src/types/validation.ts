export type ValidationStatus = 'APROBADO' | 'OBSERVADO' | 'RECHAZADO';

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export interface ValidationField {
  label: string;
  value: string;
}

export interface ValidationResult {
  id: string;
  status: ValidationStatus;
  title: string;
  summary: string;
  observations: string[];
  nextAction: string;
  detectedFields: ValidationField[];
  createdAt: string;
  fileName: string;
}

export interface ValidationHistoryItem {
  id: string;
  createdAt: string;
  fileName: string;
  status: ValidationStatus;
}

export interface ValidationRequestPayload {
  file: UploadedFile;
  expectedAmount?: string;
  expectedReference?: string;
  expectedBank?: string;
}
