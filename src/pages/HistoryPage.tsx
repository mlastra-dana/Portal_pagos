import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDate } from '../data/mockData';
import { getValidationHistory } from '../lib/api';
import type { ValidationHistoryItem } from '../types/validation';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ValidationHistoryItem[]>([]);

  useEffect(() => {
    getValidationHistory().then(setItems);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-brand-900">Historial de validaciones</h1>
        <p className="mt-2 text-sm text-muted">Consulta resultados anteriores y revisa el estado de cada comprobante procesado.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aún no hay validaciones registradas"
          description="Cuando completes una validación, podrás consultar aquí su estado y detalle."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-soft">
          <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_0.8fr_0.8fr] gap-4 border-b border-border bg-brand-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-800 md:grid">
            <span>ID de validación</span>
            <span>Fecha</span>
            <span>Archivo</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="grid gap-3 px-6 py-4 md:grid-cols-[1.2fr_1fr_1.2fr_0.8fr_0.8fr] md:items-center">
                <p className="text-sm font-medium text-brand-900">{item.id}</p>
                <p className="text-sm text-muted">{formatDate(item.createdAt)}</p>
                <p className="truncate text-sm text-muted">{item.fileName}</p>
                <StatusBadge status={item.status} />
                <SecondaryButton
                  type="button"
                  className="w-fit px-3 py-2 text-xs"
                  onClick={() => navigate('/resultado', { state: { validationId: item.id } })}
                >
                  Ver detalle
                </SecondaryButton>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
