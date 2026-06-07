import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SectionTitle } from '../components/ui/SectionTitle';
import { getCustomerSession } from '../lib/activeValidationSession';
import { formatDueDate, formatMoney } from '../lib/invoiceValidation';
import { pendingInvoices } from '../mocks/pendingInvoices';
import type { DemoCustomer, PendingInvoice } from '../types/invoice';

interface LocationState {
  customer?: DemoCustomer;
}

const industryLabel: Record<PendingInvoice['industry'], string> = {
  TELCO: 'Telco',
  INSURANCE: 'Seguros',
  BANKING: 'Banco',
};

export const PendingInvoicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [visibleInvoice, setVisibleInvoice] = useState<PendingInvoice | null>(null);
  const state = (location.state ?? {}) as LocationState;
  const customer = state.customer ?? getCustomerSession();

  if (!customer) {
    return <Navigate to="/" replace />;
  }

  const selectInvoice = (invoice: PendingInvoice) => {
    navigate('/validar', {
      state: {
        customer,
        invoice,
      },
    });
  };

  const downloadInvoice = (invoice: PendingInvoice) => {
    const content = [
      'EXAMPLE COMPANY',
      `Cliente: ${customer.cedula}`,
      `Proveedor: ${invoice.provider}`,
      `Factura: ${invoice.invoiceNumber}`,
      `Concepto: ${invoice.title}`,
      `Detalle: ${invoice.description}`,
      `Referencia interna: ${invoice.accountReference}`,
      `Vencimiento: ${formatDueDate(invoice.dueDate)}`,
      `Monto: ${formatMoney(invoice.amount, invoice.currency)}`,
    ].join('\n');

    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-panel">
        <div className="px-5 py-6 md:px-7">
          <SectionTitle
            eyebrow="Example Company"
            title="Facturas pendientes"
            description={(
              <>
                Cliente <strong className="font-semibold text-text">{customer.cedula}</strong>
              </>
            )}
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {pendingInvoices.map((invoice) => (
              <article
                key={invoice.id}
                className="flex min-h-[260px] flex-col rounded-lg border border-border bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                    {industryLabel[invoice.industry]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-brand-700 transition hover:border-brand-200 hover:bg-brand-50"
                      onClick={() => setVisibleInvoice(invoice)}
                      aria-label={`Ver factura ${invoice.invoiceNumber}`}
                      title="Ver factura"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-brand-700 transition hover:border-brand-200 hover:bg-brand-50"
                      onClick={() => downloadInvoice(invoice)}
                      aria-label={`Descargar factura ${invoice.invoiceNumber}`}
                      title="Descargar factura"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-brand-700">{invoice.provider}</p>
                  <h2 className="mt-1.5 text-lg font-bold leading-tight text-text">{invoice.title}</h2>
                  <p className="mt-1.5 text-sm leading-5 text-muted">{invoice.description}</p>
                </div>

                <dl className="mt-4 space-y-2.5 rounded-lg border border-border bg-bg p-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Vence</dt>
                    <dd className="text-sm font-bold text-text">{formatDueDate(invoice.dueDate)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Factura</dt>
                    <dd className="text-sm font-medium text-text">{invoice.invoiceNumber}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Referencia</dt>
                    <dd className="text-sm font-medium text-text">{invoice.accountReference}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Monto</dt>
                    <dd className="text-[0.95rem] font-bold text-brand-700">
                      {formatMoney(invoice.amount, invoice.currency)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  onClick={() => selectInvoice(invoice)}
                >
                  Pagar factura
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>

      {visibleInvoice ? (
        <InvoiceModal
          customer={customer}
          invoice={visibleInvoice}
          onClose={() => setVisibleInvoice(null)}
          onDownload={() => downloadInvoice(visibleInvoice)}
        />
      ) : null}
    </div>
  );
};

const InvoiceModal = ({
  customer,
  invoice,
  onClose,
  onDownload,
}: {
  customer: DemoCustomer;
  invoice: PendingInvoice;
  onClose: () => void;
  onDownload: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/45 px-4 py-6">
    <section className="w-full max-w-[620px] rounded-xl border border-border bg-white p-5 shadow-premium">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Factura</p>
          <h2 className="mt-1 text-xl font-bold text-text">{invoice.invoiceNumber}</h2>
          <p className="mt-1 text-sm text-muted">{invoice.provider}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-lg font-semibold leading-none text-brand-700 transition hover:bg-brand-50"
          onClick={onClose}
          aria-label="Cerrar detalle de factura"
        >
          ×
        </button>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <InvoiceDetail label="Cliente" value={customer.cedula} />
        <InvoiceDetail label="Industria" value={industryLabel[invoice.industry]} />
        <InvoiceDetail label="Concepto" value={invoice.title} />
        <InvoiceDetail label="Vencimiento" value={formatDueDate(invoice.dueDate)} />
        <InvoiceDetail label="Referencia interna" value={invoice.accountReference} />
        <InvoiceDetail label="Monto" value={formatMoney(invoice.amount, invoice.currency)} strong />
      </dl>

      <div className="mt-4 rounded-lg border border-border bg-bg p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Detalle</p>
        <p className="mt-1 text-sm text-text">{invoice.description}</p>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          onClick={onClose}
        >
          Cerrar
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
          onClick={onDownload}
        >
          Descargar
        </button>
      </div>
    </section>
  </div>
);

const InvoiceDetail = ({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) => (
  <div className="rounded-lg border border-border bg-white px-3 py-2">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
    <dd className={strong ? 'mt-1 text-base font-bold text-brand-700' : 'mt-1 text-sm font-bold text-text'}>
      {value}
    </dd>
  </div>
);

const EyeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 3v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);
