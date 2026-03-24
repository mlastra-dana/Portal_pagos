import { useState } from 'react';
import { formatDate } from '../../data/mockData';
import type { ValidationResult } from '../../types/validation';
import { StatusBadge } from '../ui/StatusBadge';

interface ValidationResultViewProps {
  result: ValidationResult;
}

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

export const ValidationResultView = ({ result }: ValidationResultViewProps) => {
  const [copied, setCopied] = useState(false);

  const jsonContent = JSON.stringify(result, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <StatusBadge status={result.status} />
            <h3 className="text-2xl font-semibold text-brand-900">Resultado de validación</h3>
            <p className="text-sm text-muted">{result.summary}</p>
          </div>
          <div className="text-sm text-muted">
            <p>
              ID: <span className="font-semibold text-brand-900">{result.validationId}</span>
            </p>
            <p>Procesado: {formatDate(result.processedAt)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <h4 className="text-base font-semibold text-brand-900">Datos extraídos</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FieldCard label="Banco emisor" value={displayValue(result.fields.banco_emisorIA)} />
          <FieldCard label="Código banco emisor" value={displayValue(result.fields.issuerBankIdIA)} />
          <FieldCard label="Cuenta destino" value={displayValue(result.fields.CuentaBancariaIA)} />
          <FieldCard label="Banco destino" value={displayValue(result.fields.banco_destinoIA)} />
          <FieldCard label="Fecha" value={displayValue(result.fields.fechaIA)} />
          <FieldCard label="Referencia completa detectada" value={displayValue(result.fields.rawReferenceIA)} />
          <FieldCard label="Referencia normalizada (últimos 8)" value={displayValue(result.fields.CompletereferenciaIA)} />
          <FieldCard label="Monto" value={displayValue(result.fields.montoIA)} />
        </div>
      </section>

      {result.audit?.extraction_notes?.length ? (
        <section className="rounded-lg border border-brand-200 bg-brand-50/50 p-6 shadow-soft">
          <h4 className="text-base font-semibold text-brand-900">Contexto de extracción</h4>
          <ul className="mt-3 space-y-2">
            {result.audit.extraction_notes.map((note) => (
              <li key={note} className="rounded-md border border-brand-100 bg-white px-4 py-3 text-sm text-muted">
                {note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.issues.length > 0 ? (
        <section className={`rounded-lg border p-6 shadow-soft ${issueStyle(result.status)}`}>
          <h4 className="text-base font-semibold text-brand-900">Observaciones</h4>
          <ul className="mt-3 space-y-2">
            {result.issues.map((issue) => (
              <li key={issue} className="rounded-md border border-border bg-white px-4 py-3 text-sm text-muted">
                {issue}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-brand-900">
            JSON de extracción
            <span className="text-xs text-muted transition group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              {copied ? 'JSON copiado' : 'Copiar JSON'}
            </button>
            <pre className="max-h-96 overflow-auto rounded-md border border-border bg-bg p-4 text-xs text-brand-900">{jsonContent}</pre>
          </div>
        </details>
      </section>
    </div>
  );
};

const FieldCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-md border border-border bg-bg px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-900">{value}</p>
    </div>
  );
};
