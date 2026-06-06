import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { formatMoney } from '../lib/invoiceValidation';
import { formatFileSize } from '../lib/utils';
import type { DemoCustomer, PendingInvoice } from '../types/invoice';
import type { ValidationResult } from '../types/validation';

interface ComplementaryDoc {
  id: string;
  file: File;
}

interface LocationState {
  extraction?: ValidationResult;
  customer?: DemoCustomer;
  invoice?: PendingInvoice;
  comprobante?: {
    name: string;
    size: number;
    type: string;
  };
}

const ACCEPTED_DOCS = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const ComplementaryDocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docs, setDocs] = useState<ComplementaryDoc[]>([]);
  const [error, setError] = useState('');

  const state = (location.state ?? {}) as LocationState;
  const extraction = state.extraction;
  const comprobante = state.comprobante;
  const customer = state.customer;
  const invoice = state.invoice;

  const docsTotalSize = useMemo(
    () => docs.reduce((acc, item) => acc + item.file.size, 0),
    [docs],
  );

  if (!extraction || !comprobante || !customer || !invoice) {
    return <Navigate to="/" replace />;
  }

  const onSelectFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError('');

    const incoming = Array.from(fileList);
    const valid = incoming.filter((file) => ACCEPTED_DOCS.includes(file.type));

    if (valid.length !== incoming.length) {
      setError('Algunos archivos no son válidos. Utilice PDF, JPG, PNG, WEBP, DOC o DOCX.');
    }

    const withIds = valid.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
    }));

    setDocs((prev) => [...prev, ...withIds]);
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((item) => item.id !== id));
  };

  const finalize = () => {
    setError('');
    navigate('/resultado', {
      state: {
        title: 'Pago validado',
        customer,
        invoice,
      },
    });
  };

  return (
    <div className="w-full space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-panel">
        <div className="px-5 py-6 md:px-7">
          <SectionTitle
            eyebrow="Example Company"
            title="Documentos adjuntos"
            description="Puede subir carta de reclamo, cédula, póliza u otro documento de respaldo relacionado con este pago."
          />

          <div className="mt-4">
            <Link to="/validar" state={{ customer, invoice }} className="inline-flex">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-500 transition hover:bg-brand-50"
              >
                Volver
              </button>
            </Link>
          </div>

          <div className="mt-5">
            <section className="space-y-3 rounded-lg border border-border bg-white p-3 shadow-soft">
              <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Pago asociado</p>
                <p className="mt-2 text-base font-bold text-text">{invoice.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {invoice.invoiceNumber} · Cliente {customer.cedula} · {formatMoney(invoice.amount, invoice.currency)}
                </p>
              </div>

              <p className="text-sm font-semibold text-brand-800">Comprobante principal</p>
              <div className="rounded-md border border-border bg-white px-4 py-3 text-sm text-text">
                <p className="font-semibold">{comprobante.name}</p>
                <p className="text-muted">{formatFileSize(comprobante.size)} · {comprobante.type}</p>
              </div>

              <p className="text-sm font-semibold text-brand-800">Adjuntar soporte adicional</p>
              <div className="rounded-lg border border-dashed border-brand-200 bg-white px-4 py-4">
                <div>
                  <PrimaryButton type="button" onClick={() => fileInputRef.current?.click()}>
                    Agregar documentos
                  </PrimaryButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(event) => onSelectFiles(event.target.files)}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">Formatos permitidos: PDF, JPG, PNG, WEBP, DOC, DOCX.</p>
              </div>

              <div className="space-y-2 rounded-md border border-border bg-white p-3">
                <p className="text-sm font-semibold text-brand-800">Archivos adjuntos ({docs.length})</p>
                {docs.length === 0 ? <p className="text-sm text-muted">Sin documentos complementarios.</p> : null}
                {docs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{item.file.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(item.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.file.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg font-semibold leading-none text-brand-600 transition hover:border-brand-300 hover:bg-brand-50"
                      onClick={() => removeDoc(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {docs.length > 0 ? <p className="text-xs text-muted">Total: {formatFileSize(docsTotalSize)}</p> : null}
              </div>

              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

              <div className="flex justify-end pt-3">
                <PrimaryButton
                  type="button"
                  className="min-w-[160px] px-5 py-2 text-sm"
                  onClick={finalize}
                >
                  Enviar
                </PrimaryButton>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
