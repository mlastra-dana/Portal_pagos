import { useState } from 'react';
import type { ValidationResult } from '../../types/validation';
import { StatusBadge } from '../ui/StatusBadge';

interface ValidationResultViewProps {
  result: ValidationResult;
  showDataSection?: boolean;
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

export const ValidationResultView = ({ result, showDataSection = true }: ValidationResultViewProps) => {
  const [copied, setCopied] = useState(false);
  const statusDescription: Record<ValidationResult['status'], string> = {
    APPROVED: 'Comprobante procesado.',
    OBSERVED: 'Comprobante procesado con observaciones. Revise los datos complementarios.',
    REJECTED: 'Comprobante rechazado.',
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
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d8ccc1] bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <StatusBadge status={result.status} />
            <p className="text-lg font-semibold text-text">{statusDescription[result.status]}</p>
          </div>
          <div className="text-sm text-muted">
            <p>Procesado: {formatDate(result.processedAt)}</p>
          </div>
        </div>
      </section>

      {showDataSection ? <ExtractionDataCards result={result} /> : null}

      {result.issues.length > 0 ? (
        <section className={`rounded-lg border p-6 shadow-soft ${issueStyle(result.status)}`}>
          <h4 className="text-base font-semibold text-text">Observaciones</h4>
          <ul className="mt-3 space-y-2">
            {result.issues.map((issue) => (
              <li key={issue} className="rounded-md border border-[#d8ccc1] bg-white px-4 py-3 text-sm text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.processingErrors && result.processingErrors.length > 0 ? (
        <section className="rounded-lg border border-warning/30 bg-warning/5 p-6 shadow-soft">
          <h4 className="text-base font-semibold text-text">Detalles técnicos</h4>
          <ul className="mt-3 space-y-2">
            {result.processingErrors.map((issue) => (
              <li key={issue} className="rounded-md border border-[#d8ccc1] bg-white px-4 py-3 text-sm text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-[#d8ccc1] bg-white p-6 shadow-soft">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-text">
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
            <pre className="max-h-96 overflow-auto rounded-md border border-[#d8ccc1] bg-white p-4 text-xs text-text">{extractionJson}</pre>
          </div>
        </details>
      </section>
    </div>
  );
};

export const ExtractionDataCards = ({ result }: { result: ValidationResult }) => {
  return (
    <section className="rounded-lg border border-[#d8ccc1] bg-white p-6 shadow-soft">
      <h4 className="text-base font-semibold text-text">Datos extraídos</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldCard label="Beneficiario" value={displayValue(result.fields.recipientName)} />
        <FieldCard label="Banco origen" value={displayValue(result.fields.sourceBank ?? result.fields.banco_emisorIA)} />
        <FieldCard label="Banco destino" value={displayValue(result.fields.destinationBank ?? result.fields.banco_destinoIA)} />
        <FieldCard label="Cuenta destino" value={displayValue(result.fields.recipientAccount ?? result.fields.CuentaBancariaIA)} />
        <FieldCard label="Monto" value={displayValue(result.fields.montoIA)} />
        <FieldCard label="Moneda" value={displayCurrency(result.fields.currency)} />
        <FieldCard label="Fecha" value={displayValue(result.fields.fechaIA)} />
        <FieldCard
          label="Referencia"
          value={displayValue(
            result.fields.reference
            ?? result.fields.CompletereferenciaIA
            ?? result.fields.operationNumber
            ?? result.fields.rawReferenceIA,
          )}
        />
      </div>
    </section>
  );
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
    <div className="rounded-md border border-[#d8ccc1] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-text">{value}</p>
    </div>
  );
};
