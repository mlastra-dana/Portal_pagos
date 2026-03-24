import { validationHistoryMock, validationResultsByStatus } from '../data/mockData';
import type {
  ValidationHistoryItem,
  ValidationRequestPayload,
  ValidationResult,
  ValidationStatus,
} from '../types/validation';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockStore = new Map<string, ValidationResult>();

const statusFromFileName = (fileName: string): ValidationStatus => {
  const value = fileName.toLowerCase();
  if (value.includes('obs') || value.includes('revision')) return 'OBSERVADO';
  if (value.includes('rech') || value.includes('error') || value.includes('borroso')) return 'RECHAZADO';

  const statuses: ValidationStatus[] = ['APROBADO', 'OBSERVADO', 'RECHAZADO'];
  const score = Array.from(fileName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return statuses[score % statuses.length];
};

export const uploadReceipt = async (payload: ValidationRequestPayload): Promise<{ fileToken: string }> => {
  await sleep(900);

  if (!payload.file.file) {
    throw new Error('No se recibió un archivo para procesar.');
  }

  const fileToken = `UPL-${Date.now()}`;
  return { fileToken };
};

export const validateReceipt = async (
  fileToken: string,
  payload: ValidationRequestPayload,
): Promise<{ validationId: string; status: ValidationStatus }> => {
  await sleep(1900);
  if (!fileToken.trim()) {
    throw new Error('Token de carga inválido.');
  }

  const status = statusFromFileName(payload.file.name);
  const base = validationResultsByStatus[status];
  const validationId = `VAL-${Date.now()}`;

  const result: ValidationResult = {
    ...base,
    id: validationId,
    createdAt: new Date().toISOString(),
    fileName: payload.file.name,
  };

  mockStore.set(validationId, result);
  return { validationId, status };
};

export const getValidationResult = async (validationId: string): Promise<ValidationResult> => {
  await sleep(700);
  const found = mockStore.get(validationId);
  if (found) return found;

  const fallback = validationResultsByStatus.APROBADO;
  return {
    ...fallback,
    id: validationId,
    createdAt: new Date().toISOString(),
  };
};

export const getValidationHistory = async (): Promise<ValidationHistoryItem[]> => {
  await sleep(650);
  return validationHistoryMock;
};
