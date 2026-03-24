import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ResultField } from '../components/ui/ResultField';
import { ResultSummaryCard } from '../components/ui/ResultSummaryCard';
import { SectionTitle } from '../components/ui/SectionTitle';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getValidationResult } from '../lib/api';
import { formatDate } from '../data/mockData';
import type { ValidationResult } from '../types/validation';

interface ResultLocationState {
  validationId?: string;
}

export const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as ResultLocationState | null) ?? null;
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!state?.validationId) {
        navigate('/validar');
        return;
      }

      try {
        const response = await getValidationResult(state.validationId);
        setResult(response);
      } catch {
        setError('No pudimos recuperar el resultado de la validación.');
      }
    };

    load();
  }, [navigate, state?.validationId]);

  if (error) {
    return <p className="text-sm font-medium text-danger">{error}</p>;
  }

  if (!result) {
    return <p className="text-sm text-muted">Cargando resultado...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-border bg-white p-6 shadow-panel sm:p-8">
        <StatusBadge status={result.status} />
        <div className="mt-4 space-y-2">
          <SectionTitle title={result.title} description={result.summary} />
          <p className="text-sm text-muted">Fecha de validación: {formatDate(result.createdAt)}</p>
        </div>
      </div>

      <ResultSummaryCard title="Datos extraídos del comprobante">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.detectedFields.map((field) => (
            <ResultField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
      </ResultSummaryCard>

      <ResultSummaryCard title="Observaciones">
        <ul className="space-y-2">
          {result.observations.map((item) => (
            <li key={item} className="rounded-md border border-border bg-bg px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </ResultSummaryCard>

      <ResultSummaryCard title="Siguiente acción">
        <p>{result.nextAction}</p>
      </ResultSummaryCard>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/validar"
          className="inline-flex items-center rounded-md bg-brand-800 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Validar otro comprobante
        </Link>
        <Link
          to="/historial"
          className="inline-flex items-center rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
        >
          Ver historial
        </Link>
      </div>
    </div>
  );
};
