import { useState } from 'react';
import type { DocumentCategory, ValidationResult } from '../../types/validation';
import { StatusBadge } from '../ui/StatusBadge';

interface ValidationResultViewProps {
  result: ValidationResult;
  showDataSection?: boolean;
  showStatusSection?: boolean;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('es-VE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const displayValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'No detectado';
  if (typeof value === 'number') return value.toLocaleString('es-VE');
  return value;
};

const issueStyle = (status: ValidationResult['status']): string => {
  if (status === 'REJECTED') return 'border-danger/30 bg-danger/5';
  if (status === 'OBSERVED') return 'border-warning/30 bg-warning/5';
  return 'border-border bg-bg';
};

export const ValidationResultView = ({
  result,
  showDataSection = true,
  showStatusSection = true,
}: ValidationResultViewProps) => {
  const [copied, setCopied] = useState(false);
  const statusDescription: Record<ValidationResult['status'], string> = {
    APPROVED: 'Comprobante procesado.',
    OBSERVED: 'Comprobante procesado con observaciones.',
    REJECTED: 'Comprobante rechazado.',
  };
  const paymentStatusLabel: Record<string, string> = {
    COMPLETED: 'Pago completado',
    PENDING: 'Pago en proceso',
    FAILED: 'Pago fallido',
    UNKNOWN: 'Estado no determinado',
  };

  const extractionJson = JSON.stringify(result.extractedDocument ?? result.rawExtraction?.document ?? {}, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(extractionJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      {showStatusSection ? (
        <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1.5">
              <StatusBadge status={result.status} />
              <p className="text-base font-semibold text-text">{statusDescription[result.status]}</p>
              {result.fields.paymentStatus ? (
                <p className="text-xs font-semibold text-muted">
                  {paymentStatusLabel[result.fields.paymentStatus] ?? result.fields.paymentStatus}
                </p>
              ) : null}
            </div>
            <div className="text-xs text-muted">
              <p>Procesado: {formatDate(result.processedAt)}</p>
            </div>
          </div>
        </section>
      ) : null}

      {showDataSection ? <ExtractionDataCards result={result} /> : null}

      {result.issues.length > 0 ? (
        <section className={`rounded-lg border p-4 shadow-soft ${issueStyle(result.status)}`}>
          <h4 className="text-sm font-semibold text-text">Observaciones</h4>
          <ul className="mt-3 space-y-2">
            {result.issues.map((issue) => (
              <li key={issue} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.processingErrors && result.processingErrors.length > 0 ? (
        <section className="rounded-lg border border-warning/30 bg-warning/5 p-4 shadow-soft">
          <h4 className="text-sm font-semibold text-text">Detalles técnicos</h4>
          <ul className="mt-3 space-y-2">
            {result.processingErrors.map((issue) => (
              <li key={issue} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-text">
            JSON de extracción
            <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500 hover:bg-brand-100"
            >
              {copied ? 'JSON copiado' : 'Copiar JSON'}
            </button>
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-white p-3 text-xs text-text">{extractionJson}</pre>
          </div>
        </details>
      </section>
    </div>
  );
};

export const ExtractionDataCards = ({ result }: { result: ValidationResult }) => {
  const cards = getFieldCards(result);

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <h4 className="text-sm font-semibold text-text">Datos extraídos</h4>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <FieldCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
    </section>
  );
};

const getFieldCards = (result: ValidationResult): Array<{ label: string; value: string }> => {
  const category: DocumentCategory = result.documentCategory ?? 'BANK_TRANSFER';
  const referenceValue = displayValue(
    result.fields.reference
    ?? result.fields.CompletereferenciaIA
    ?? result.fields.operationNumber
    ?? result.fields.rawReferenceIA,
  );

  if (category === 'DIGITAL_WALLET') {
    return [
      { label: 'Beneficiario', value: displayValue(result.fields.recipientName) },
      { label: 'Origen del pago', value: displayValue(result.fields.sourceBank ?? result.fields.senderAccount ?? result.fields.senderName ?? result.fields.banco_emisorIA) },
      { label: 'Destino', value: displayValue(result.fields.recipientAccount ?? result.fields.CuentaBancariaIA ?? result.fields.recipientName) },
      { label: 'Método', value: displayValue(result.fields.paymentMethod ?? result.fields.documentType) },
      { label: 'Monto', value: displayValue(result.fields.montoIA) },
      { label: 'Moneda', value: displayCurrency(result.fields.currency) },
      { label: 'Fecha', value: displayValue(result.fields.fechaIA) },
      { label: 'Referencia', value: referenceValue },
    ];
  }

  return [
    { label: 'Beneficiario', value: displayValue(result.fields.recipientName) },
    { label: 'Banco origen', value: displayValue(result.fields.sourceBank ?? result.fields.banco_emisorIA) },
    { label: 'Banco destino', value: displayValue(result.fields.destinationBank ?? result.fields.banco_destinoIA) },
    { label: 'Cuenta destino', value: displayValue(result.fields.recipientAccount ?? result.fields.CuentaBancariaIA) },
    { label: 'Monto', value: displayValue(result.fields.montoIA) },
    { label: 'Moneda', value: displayCurrency(result.fields.currency) },
    { label: 'Fecha', value: displayValue(result.fields.fechaIA) },
    { label: 'Referencia', value: referenceValue },
  ];
};

const displayCurrency = (value: string | null | undefined): string => {
  if (!value) return 'No detectado';

  const normalized = value.trim().toUpperCase();
  if (normalized === 'PEN') return 'Soles (PEN)';
  if (normalized === 'USD') return 'Dólares (USD)';
  if (normalized === 'EUR') return 'Euros (EUR)';
  if (normalized === 'VES') return 'Bolívares (VES)';

  return normalized;
};

const FieldCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-md border border-border bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-text">{value}</p>
    </div>
  );
};
