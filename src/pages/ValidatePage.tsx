import { FormEvent, useEffect, useState } from 'react';
import { ValidationResultView } from '../components/result/ValidationResultView';
import { FilePreviewCard } from '../components/ui/FilePreviewCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { UploadDropzone } from '../components/ui/UploadDropzone';
import { useFileUpload } from '../hooks/useFileUpload';
import { validateReceipt } from '../lib/api';
import type { ValidationResult } from '../types/validation';

export const ValidatePage = () => {
  const { uploadedFile, isImage, error, setFile, clearFile } = useFileUpload();

  const [nombreDepositante, setNombreDepositante] = useState('');
  const [cedulaTipo, setCedulaTipo] = useState<'V' | 'J'>('V');
  const [cedulaNumero, setCedulaNumero] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoExtracting, setIsAutoExtracting] = useState(false);
  const [formError, setFormError] = useState('');
  const [technicalError, setTechnicalError] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleClearAll = () => {
    clearFile();
    setResult(null);
    setFormError('');
    setTechnicalError('');
    setNombreDepositante('');
    setCedulaTipo('V');
    setCedulaNumero('');
  };

  useEffect(() => {
    if (!uploadedFile) {
      setResult(null);
      return;
    }

    let isCancelled = false;

    const runAutoExtraction = async () => {
      setResult(null);
      setIsAutoExtracting(true);
      setFormError('');
      setTechnicalError('');

      try {
        const autoResult = await validateReceipt(uploadedFile.file);
        if (isCancelled) return;

        setResult(autoResult);
      } catch (autoError) {
        if (isCancelled) return;
        setFormError('No fue posible extraer datos al cargar el comprobante.');
        setTechnicalError(autoError instanceof Error ? autoError.message : 'Error inesperado en la extracción.');
      } finally {
        if (!isCancelled) {
          setIsAutoExtracting(false);
        }
      }
    };

    runAutoExtraction();

    return () => {
      isCancelled = true;
    };
  }, [uploadedFile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setTechnicalError('');

    if (!uploadedFile) {
      setFormError('Debes cargar un comprobante para iniciar la validación.');
      return;
    }

    try {
      setIsSubmitting(true);
      const cedulaDepositante = cedulaNumero.trim() ? `${cedulaTipo}-${cedulaNumero.trim()}` : undefined;
      const response = await validateReceipt(uploadedFile.file, {
        nombreDepositante: nombreDepositante.trim() || undefined,
        cedulaDepositante,
      });
      setResult(response);
    } catch (submitError) {
      setFormError('No fue posible procesar el comprobante. Verifica el archivo e inténtalo nuevamente.');
      setTechnicalError(submitError instanceof Error ? submitError.message : 'Error inesperado en la validación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-[#f5f6f8] shadow-premium">
        <form onSubmit={handleSubmit} className="px-7 py-8 md:px-9">
          <SectionTitle
            eyebrow="Gestión de pagos"
            title="Cargue el comprobante"
            description="Adjunte el archivo para extraer automaticamente los datos del pago."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-brand-100 bg-white p-4 shadow-soft">
              {!uploadedFile ? <UploadDropzone onFileSelected={setFile} error={error} /> : null}

              {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={handleClearAll} /> : null}

              <div className="rounded-xl border border-brand-100 bg-bg p-3">
                <p className="text-sm font-semibold text-brand-900">Datos extraídos del comprobante</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ExtractedInput
                    label="Cuenta destino"
                    value={formatExtracted(result?.fields.CuentaBancariaIA)}
                  />
                  <ExtractedInput
                    label="Banco destino"
                    value={formatExtracted(result?.fields.banco_destinoIA)}
                  />
                  <ExtractedInput
                    label="Monto"
                    value={formatExtracted(result?.fields.montoIA)}
                  />
                  <ExtractedInput
                    label="Fecha"
                    value={formatExtracted(result?.fields.fechaIA)}
                  />
                  <ExtractedInput
                    label="Referencia"
                    value={formatExtracted(result?.fields.CompletereferenciaIA ?? result?.fields.rawReferenceIA)}
                  />
                  <ExtractedInput
                    label="Banco emisor"
                    value={formatExtracted(result?.fields.banco_emisorIA)}
                  />
                  <ExtractedInput
                    label="Codigo banco emisor"
                    value={formatExtracted(result?.fields.issuerBankIdIA)}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-brand-100 bg-white p-4 shadow-soft">
              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold text-brand-900">Datos del depositante</legend>

                <div>
                  <label htmlFor="nombreDepositante" className="mb-2 mt-2 block text-sm font-medium text-brand-900">
                    Nombre
                  </label>
                  <input
                    id="nombreDepositante"
                    type="text"
                    value={nombreDepositante}
                    onChange={(event) => setNombreDepositante(event.target.value)}
                    className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label className="mb-2 mt-2 block text-sm font-medium text-brand-900">
                    Cédula de identidad
                  </label>
                  <div className="grid grid-cols-[86px_1fr] gap-2">
                    <select
                      aria-label="Tipo de cédula"
                      value={cedulaTipo}
                      onChange={(event) => setCedulaTipo(event.target.value as 'V' | 'J')}
                      className="rounded-md border border-border bg-white px-3 py-2.5 text-sm font-semibold text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="V">V</option>
                      <option value="J">J</option>
                    </select>
                    <input
                      id="cedulaDepositante"
                      type="text"
                      inputMode="numeric"
                      value={cedulaNumero}
                      onChange={(event) => setCedulaNumero(event.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              </fieldset>

              {formError ? <p className="mt-4 text-sm font-medium text-danger">{formError}</p> : null}
              {technicalError ? <p className="mt-1 text-xs text-muted">Detalle técnico: {technicalError}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <PrimaryButton
                  type="submit"
                  disabled={!uploadedFile || isSubmitting || isAutoExtracting}
                  className="w-full py-2.5 text-base"
                >
                  {isSubmitting ? 'Validando...' : 'Validar comprobante'}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={handleClearAll}
                  disabled={isSubmitting || isAutoExtracting || !uploadedFile}
                  className="w-full"
                >
                  Limpiar archivo
                </SecondaryButton>
              </div>

              {isAutoExtracting ? (
                <InlineProcessingState
                  title="Extrayendo datos del comprobante"
                  message="Procesando archivo recién cargado..."
                />
              ) : null}

              {isSubmitting ? (
                <InlineProcessingState
                  title="Validando datos del comprobante"
                  message="Procesando extracción y validación con datos manuales del depositante..."
                />
              ) : null}

              {!isAutoExtracting && !isSubmitting && result ? (
                <div className="mt-4">
                  <ValidationResultView result={result} />
                </div>
              ) : null}
            </section>
          </div>
        </form>
      </div>

    </div>
  );
};

const ExtractedInput = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
    <input
      type="text"
      value={value}
      readOnly
      className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-brand-900 placeholder:text-muted"
    />
  </div>
);

const formatExtracted = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
};

const InlineProcessingState = ({ title, message }: { title: string; message: string }) => (
  <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <div>
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <p className="text-xs text-muted">{message}</p>
      </div>
    </div>
  </div>
);
