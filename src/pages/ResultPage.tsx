import { Link, Navigate, useLocation } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { formatDueDate, formatMoney } from '../lib/invoiceValidation';
import type { DemoCustomer, PendingInvoice } from '../types/invoice';

export const ResultPage = () => {
  const location = useLocation();
  const state = (location.state ?? {}) as {
    title?: string;
    customer?: DemoCustomer;
    invoice?: PendingInvoice;
  };

  if (!state.title) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-panel">
        <div className="px-5 py-6 md:px-7">
          <SectionTitle
            eyebrow="Example Company"
            title={state.title}
          />

          <div className="mt-5 rounded-lg border border-border bg-white p-4 shadow-soft">
            <p className="text-base font-semibold text-text">{state.title}</p>
            {state.invoice && state.customer ? (
              <div className="mt-5 rounded-lg border border-success/20 bg-success/5 p-4">
                <p className="text-sm font-bold text-success">El pago quedó asociado a la factura seleccionada.</p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Cliente</dt>
                    <dd className="mt-1 text-sm font-bold text-text">{state.customer.cedula}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Factura</dt>
                    <dd className="mt-1 text-sm font-bold text-text">{state.invoice.invoiceNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Vencimiento</dt>
                    <dd className="mt-1 text-sm font-bold text-text">{formatDueDate(state.invoice.dueDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Monto</dt>
                    <dd className="mt-1 text-sm font-bold text-text">
                      {formatMoney(state.invoice.amount, state.invoice.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <div className="mt-6">
              <Link to="/" className="inline-flex">
                <PrimaryButton className="px-6 py-2.5 text-sm">
                  Nueva consulta
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
