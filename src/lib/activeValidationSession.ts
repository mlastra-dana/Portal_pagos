import type { DemoCustomer, PendingInvoice } from '../types/invoice';
import type { UploadedFile, ValidationResult } from '../types/validation';
import { fileToBase64 } from './fileToBase64';

export interface ActiveValidationSession {
  customer: DemoCustomer;
  invoice: PendingInvoice;
  uploadedFile: UploadedFile;
  result: ValidationResult;
}

interface StoredUploadedFile {
  name: string;
  size: number;
  type: string;
  fileBase64: string;
}

interface StoredActiveValidationSession {
  customer: DemoCustomer;
  invoice: PendingInvoice;
  uploadedFile: StoredUploadedFile;
  result: ValidationResult;
}

const CUSTOMER_SESSION_KEY = 'gestion-pagos-customer-session';
const ACTIVE_VALIDATION_KEY = 'gestion-pagos-active-validation';

let activeValidationSession: ActiveValidationSession | null = null;
let customerSession: DemoCustomer | null = null;

const canUseSessionStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

const base64ToFile = (base64: string, name: string, type: string): File => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], name, { type });
};

const restoreUploadedFile = (stored: StoredUploadedFile): UploadedFile => {
  const file = base64ToFile(stored.fileBase64, stored.name, stored.type);

  return {
    file,
    name: stored.name,
    size: stored.size,
    type: stored.type,
    previewUrl: URL.createObjectURL(file),
  };
};

const readCustomerSessionFromStorage = (): DemoCustomer | null => {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(CUSTOMER_SESSION_KEY);
    return raw ? JSON.parse(raw) as DemoCustomer : null;
  } catch {
    return null;
  }
};

const readActiveValidationFromStorage = (): ActiveValidationSession | null => {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_VALIDATION_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredActiveValidationSession;
    return {
      customer: stored.customer,
      invoice: stored.invoice,
      uploadedFile: restoreUploadedFile(stored.uploadedFile),
      result: stored.result,
    };
  } catch {
    return null;
  }
};

export const getCustomerSession = () => {
  if (customerSession) return customerSession;

  customerSession = readCustomerSessionFromStorage();
  return customerSession;
};

export const saveCustomerSession = (customer: DemoCustomer) => {
  customerSession = customer;

  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
  } catch {
    // Session persistence is helpful for refresh, but the flow can continue without it.
  }
};

export const getActiveValidationSession = () => {
  if (activeValidationSession) return activeValidationSession;

  activeValidationSession = readActiveValidationFromStorage();
  if (activeValidationSession) {
    customerSession = activeValidationSession.customer;
  }

  return activeValidationSession;
};

export const saveActiveValidationSession = (session: ActiveValidationSession) => {
  activeValidationSession = session;
  saveCustomerSession(session.customer);

  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(ACTIVE_VALIDATION_KEY);
  } catch {
    // Continue with the in-memory session.
  }

  fileToBase64(session.uploadedFile.file)
    .then((fileBase64) => {
      const stored: StoredActiveValidationSession = {
        customer: session.customer,
        invoice: session.invoice,
        uploadedFile: {
          name: session.uploadedFile.name,
          size: session.uploadedFile.size,
          type: session.uploadedFile.type,
          fileBase64,
        },
        result: session.result,
      };

      window.sessionStorage.setItem(ACTIVE_VALIDATION_KEY, JSON.stringify(stored));
    })
    .catch(() => {
      // Large files can exceed browser quota. Keep the in-memory session when that happens.
    });
};

export const clearActiveValidationSession = () => {
  activeValidationSession = null;
  customerSession = null;

  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.removeItem(ACTIVE_VALIDATION_KEY);
    window.sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    // Nothing to do if the browser refuses storage access.
  }
};
