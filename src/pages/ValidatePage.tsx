import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtractionDataCards, ValidationResultView } from '../components/result/ValidationResultView';
import { FilePreviewCard } from '../components/ui/FilePreviewCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
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
    setIsAutoExtracting(false);
    setResult(null);
    setFormError('');
    setTechnicalError('');
  };

  useEffect(() => {
    if (!uploadedFile) {
      setIsAutoExtracting(false);
      setFormError('');
      setTechnicalError('');
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
      setFormError('Debe cargar un comprobante para iniciar la validación.');
      return;
    }

    if (!result) {
      setFormError('Primero debe finalizar la extracción del comprobante.');
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
    || (result.missingRequiredFields?.length ?? 0) > 0
    || isAutoExtracting;

  return (
    <div className="w-full space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,255,255,0.97))] shadow-premium">
        <form onSubmit={handleSubmit} className="px-7 py-8 md:px-9">
          <SectionTitle
            eyebrow="Example Company"
            title="Extracción de comprobante"
            description="Cargue un comprobante y permita que el motor de extracción complete los datos detectados y el JSON estructurado."
          />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="space-y-4 rounded-[1.5rem] border border-border bg-white p-4 shadow-soft">
              {!uploadedFile ? <UploadDropzone onFileSelected={setFile} error={error} /> : null}

              {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={handleClearAll} /> : null}

              {!isAutoExtracting && result ? <ExtractionDataCards result={result} /> : null}
            </section>

            <section className="flex min-h-full flex-col rounded-[1.5rem] border border-border bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-brand-800">Resultado de extracción</p>

              {formError ? <p className="mt-4 text-sm font-medium text-danger">{formError}</p> : null}
              {technicalError ? <p className="mt-1 text-xs text-muted">Detalle técnico: {technicalError}</p> : null}

              {isAutoExtracting ? (
                <InlineProcessingState
                  title="Extrayendo datos del comprobante"
                  message="Procesando archivo recién cargado..."
                />
              ) : null}

              {!isAutoExtracting && result ? (
                <div className="mt-4">
                  <ValidationResultView result={result} showDataSection={false} />
                </div>
              ) : null}

              <div className="mt-auto pt-4">
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton
                    type="submit"
                    disabled={isContinueDisabled}
                    className="w-full py-2.5 text-base"
                  >
                    Continuar
                  </PrimaryButton>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>

    </div>
  );
};
const InlineProcessingState = ({ title, message }: { title: string; message: string }) => (
  <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <div>
        <p className="text-sm font-semibold text-brand-800">{title}</p>
        <p className="text-xs text-muted">{message}</p>
      </div>
    </div>
  </div>
);
