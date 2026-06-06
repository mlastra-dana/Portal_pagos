import type { PendingInvoice } from '../types/invoice';
import type { ValidationResult } from '../types/validation';

export interface PaymentMatchResult {
  status: 'MATCH' | 'MISMATCH';
  amountMatches: boolean;
  currencyMatches: boolean;
  hasRequiredExtractionFields: boolean;
  detectedAmount: number | null;
  detectedCurrency: string | null;
  detectedDate: string | null;
  detectedReference: string | null;
  issues: string[];
}

const AMOUNT_TOLERANCE = 0.01;

export const formatMoney = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'VES' ? 2 : 2,
  }).format(amount);
};

export const formatDueDate = (value: string) => {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const validatePaymentAgainstInvoice = (
  invoice: PendingInvoice,
  result: ValidationResult | null,
): PaymentMatchResult | null => {
  if (!result) return null;

  const detectedAmount = result.fields.amount ?? result.fields.montoIA ?? null;
  const detectedCurrency = result.fields.currency?.trim().toUpperCase() ?? null;
  const detectedDate = result.fields.transactionDate ?? result.fields.fechaIA ?? null;
  const detectedReference =
    result.fields.reference
    ?? result.fields.CompletereferenciaIA
    ?? result.fields.operationNumber
    ?? result.fields.rawReferenceIA
    ?? null;
  const amountMatches =
    detectedAmount !== null && Math.abs(detectedAmount - invoice.amount) <= AMOUNT_TOLERANCE;
  const currencyMatches = detectedCurrency === invoice.currency;
  const hasRequiredExtractionFields = Boolean(detectedAmount !== null && detectedDate && detectedReference);
  const issues: string[] = [];

  if (detectedAmount === null) {
    issues.push('No se detectó un monto en el comprobante.');
  } else if (!amountMatches) {
    issues.push('No coincide con la factura.');
  }

  if (!detectedCurrency) {
    issues.push('No se detectó la moneda del pago.');
  } else if (!currencyMatches) {
    issues.push('La moneda no coincide con la factura.');
  }

  if (!detectedDate) {
    issues.push('No se detectó la fecha del comprobante.');
  }

  if (!detectedReference) {
    issues.push('No se detectó la referencia del comprobante.');
  }

  const status = amountMatches && currencyMatches && hasRequiredExtractionFields ? 'MATCH' : 'MISMATCH';

  return {
    status,
    amountMatches,
    currencyMatches,
    hasRequiredExtractionFields,
    detectedAmount,
    detectedCurrency,
    detectedDate,
    detectedReference,
    issues,
  };
};
