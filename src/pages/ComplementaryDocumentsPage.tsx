import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { formatFileSize } from '../lib/utils';
import type { ValidationResult } from '../types/validation';

interface ComplementaryDoc {
  id: string;
  file: File;
}

interface LocationState {
  depositor?: {
    nombre: string;
    cedula: string;
  };
  extraction?: ValidationResult;
  comprobante?: {
    name: string;
    size: number;
    type: string;
  };
}

const ACCEPTED_DOCS = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const ComplementaryDocumentsPage = () => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docs, setDocs] = useState<ComplementaryDoc[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const state = (location.state ?? {}) as LocationState;
  const depositor = state.depositor;
  const extraction = state.extraction;
  const comprobante = state.comprobante;

  const docsTotalSize = useMemo(
    () => docs.reduce((acc, item) => acc + item.file.size, 0),
    [docs],
  );

  if (!depositor || !extraction || !comprobante) {
    return <Navigate to="/validar" replace />;
  }

  const onSelectFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError('');
    setSuccess('');

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
    setSuccess('');
  };

  const finalize = () => {
    setError('');
    setSuccess('Registro completado. Los documentos complementarios quedaron adjuntos al trámite.');
  };

  return (
    <div className="w-full space-y-8">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-[#f5f6f8] shadow-premium">
        <div className="px-7 py-8 md:px-9">
          <SectionTitle
            eyebrow="Gestión de pagos"
            title="Documentos complementarios"
            description="Adjunte documentos adicionales para completar el registro del pago."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-brand-100 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-brand-900">Comprobante principal</p>
              <div className="rounded-md border border-border bg-bg px-4 py-3 text-sm text-brand-900">
                <p className="font-semibold">{comprobante.name}</p>
                <p className="text-muted">{formatFileSize(comprobante.size)} · {comprobante.type}</p>
              </div>

              <p className="text-sm font-semibold text-brand-900">Adjuntar soporte adicional</p>
              <div className="rounded-xl border border-dashed border-brand-200 bg-bg px-4 py-5">
                <p className="text-sm text-muted">
                  Puede subir carta de reclamo, cédula, póliza u otro documento de respaldo.
                </p>
                <div className="mt-3">
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

              <div className="space-y-2 rounded-md border border-border bg-bg p-3">
                <p className="text-sm font-semibold text-brand-900">Archivos adjuntos ({docs.length})</p>
                {docs.length === 0 ? <p className="text-sm text-muted">Sin documentos complementarios.</p> : null}
                {docs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-900">{item.file.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(item.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.file.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg font-semibold leading-none text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
                      onClick={() => removeDoc(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {docs.length > 0 ? <p className="text-xs text-muted">Total: {formatFileSize(docsTotalSize)}</p> : null}
              </div>
            </section>

            <section className="space-y-4 rounded-xl border border-brand-100 bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-brand-900">Resumen del trámite</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <ReadOnlyField label="Nombre" value={depositor.nombre} />
                <ReadOnlyField label="Cédula" value={depositor.cedula} />
                <ReadOnlyField label="Banco emisor" value={extraction.fields.banco_emisorIA ?? ''} />
                <ReadOnlyField label="Banco destino" value={extraction.fields.banco_destinoIA ?? ''} />
                <ReadOnlyField label="Monto" value={extraction.fields.montoIA != null ? String(extraction.fields.montoIA) : ''} />
                <ReadOnlyField label="Referencia" value={extraction.fields.CompletereferenciaIA ?? extraction.fields.rawReferenceIA ?? ''} />
              </div>

              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              {success ? <p className="text-sm font-medium text-success">{success}</p> : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <PrimaryButton type="button" className="w-full py-2.5 text-base" onClick={finalize}>
                  Terminar registro
                </PrimaryButton>
                <Link to="/validar" className="w-full">
                  <SecondaryButton type="button" className="w-full">
                    Volver al paso inicial
                  </SecondaryButton>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
    <input
      type="text"
      value={value}
      readOnly
      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-brand-900"
    />
  </div>
);
