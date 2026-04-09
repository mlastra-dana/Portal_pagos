import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { uploadedFile, isImage, error, setFile, clearFile } = useFileUpload();

  const [isAutoExtracting, setIsAutoExtracting] = useState(false);
  const [formError, setFormError] = useState('');
  const [technicalError, setTechnicalError] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleClearAll = () => {
    clearFile();
    setResult(null);
    setFormError('');
    setTechnicalError('');
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

    if (!result) {
      setFormError('Primero debemos terminar la extracción del comprobante.');
      return;
    }

    navigate('/documentos-complementarios', {
      state: {
        extraction: result,
        comprobante: {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type,
        },
      },
    });
  };

  const isContinueDisabled =
    !uploadedFile
    || !result
    || isAutoExtracting;

  return (
    <div className="w-full space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,242,0.98))] shadow-premium">
        <form onSubmit={handleSubmit} className="px-7 py-8 md:px-9">
          <SectionTitle
            eyebrow="DANAConnect Demo"
            title="Extracción de comprobante"
            description="Carga un comprobante y deja que el motor de extracción complete los datos detectados y el JSON estructurado."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="space-y-4 rounded-[1.5rem] border border-border bg-white p-4 shadow-soft">
              {!uploadedFile ? <UploadDropzone onFileSelected={setFile} error={error} /> : null}

              {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={handleClearAll} /> : null}

              <div className="rounded-[1.25rem] border border-border bg-bg p-3">
                <p className="text-sm font-semibold text-brand-900">Datos extraídos del comprobante</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <ExtractedInput
                    label="Beneficiario"
                    value={formatExtracted(result?.fields.recipientName)}
                  />
                  <ExtractedInput
                    label="Banco origen"
                    value={formatExtracted(result?.fields.sourceBank ?? result?.fields.banco_emisorIA)}
                  />
                  <ExtractedInput
                    label="Banco destino"
                    value={formatExtracted(result?.fields.destinationBank ?? result?.fields.banco_destinoIA)}
                  />
                  <ExtractedInput
                    label="Cuenta destino"
                    value={formatExtracted(result?.fields.recipientAccount ?? result?.fields.CuentaBancariaIA)}
                  />
                  <ExtractedInput
                    label="Monto"
                    value={formatAmount(result?.fields.montoIA, result?.fields.currency)}
                  />
                  <ExtractedInput
                    label="Fecha"
                    value={formatExtracted(result?.fields.fechaIA)}
                  />
                  <ExtractedInput
                    label="Referencia"
                    value={formatExtracted(
                      result?.fields.reference
                      ?? result?.fields.CompletereferenciaIA
                      ?? result?.fields.operationNumber
                      ?? result?.fields.rawReferenceIA,
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-border bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-brand-900">Resultado de extracción</p>
              <p className="mt-2 text-sm text-muted">
                Este portal toma la información directamente del comprobante. No se solicitan datos manuales del depositante en este flujo.
              </p>

              {formError ? <p className="mt-4 text-sm font-medium text-danger">{formError}</p> : null}
              {technicalError ? <p className="mt-1 text-xs text-muted">Detalle técnico: {technicalError}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <PrimaryButton
                  type="submit"
                  disabled={isContinueDisabled}
                  className="w-full py-2.5 text-base"
                >
                  Continuar
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  onClick={handleClearAll}
                  disabled={isAutoExtracting || !uploadedFile}
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

              {!isAutoExtracting && result ? (
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

const formatAmount = (amount: number | null | undefined, currency: string | null | undefined): string => {
  if (amount === null || amount === undefined) return '';
  if (!currency) return String(amount);
  return `${currency} ${amount}`;
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
