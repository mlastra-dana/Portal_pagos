import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValidationResultView } from '../components/result/ValidationResultView';
import { FilePreviewCard } from '../components/ui/FilePreviewCard';
import { LoadingState } from '../components/ui/LoadingState';
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

  const [montoEsperado, setMontoEsperado] = useState('');
  const [referenciaEsperada, setReferenciaEsperada] = useState('');
  const [bancoEsperado, setBancoEsperado] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [technicalError, setTechnicalError] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

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
      const response = await validateReceipt(uploadedFile.file, {
        montoEsperado: montoEsperado.trim() || undefined,
        referenciaEsperada: referenciaEsperada.trim() || undefined,
        bancoEsperado: bancoEsperado.trim() || undefined,
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel md:grid md:grid-cols-[0.88fr_1.12fr]">
        <aside className="bg-brand-700 px-8 py-10 text-white sm:px-10 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Validación</p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">Validación de comprobantes</h2>
          <p className="mt-4 text-lg leading-8 text-white/90">
            Cargue el archivo y, si lo desea, agregue datos de referencia para mejorar la precisión de la validación.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Volver al inicio
          </button>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-6 px-8 py-10 sm:px-10 sm:py-12">
          <SectionTitle
            eyebrow="Carga de comprobante"
            title="Formulario de validación"
            description="Adjunte su comprobante de pago. El sistema enviará el archivo para extraer y validar los datos automáticamente."
          />

          <UploadDropzone onFileSelected={setFile} error={error} />

          {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={clearFile} /> : null}

          <fieldset className="grid gap-4 md:grid-cols-3">
            <legend className="text-sm font-semibold text-brand-900">Datos esperados (opcionales)</legend>

            <div>
              <label htmlFor="montoEsperado" className="mb-2 mt-2 block text-sm font-medium text-brand-900">
                Monto esperado
              </label>
              <input
                id="montoEsperado"
                type="text"
                value={montoEsperado}
                onChange={(event) => setMontoEsperado(event.target.value)}
                placeholder="Ej. 1200.50"
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="referenciaEsperada" className="mb-2 mt-2 block text-sm font-medium text-brand-900">
                Referencia esperada
              </label>
              <input
                id="referenciaEsperada"
                type="text"
                value={referenciaEsperada}
                onChange={(event) => setReferenciaEsperada(event.target.value)}
                placeholder="Ej. 84512012"
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="bancoEsperado" className="mb-2 mt-2 block text-sm font-medium text-brand-900">
                Banco esperado
              </label>
              <input
                id="bancoEsperado"
                type="text"
                value={bancoEsperado}
                onChange={(event) => setBancoEsperado(event.target.value)}
                placeholder="Ej. Banco Mercantil"
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </fieldset>

          {formError ? <p className="text-sm font-medium text-danger">{formError}</p> : null}
          {technicalError ? <p className="text-xs text-muted">Detalle técnico: {technicalError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="submit" disabled={!uploadedFile || isSubmitting} className="px-7">
              {isSubmitting ? 'Validando...' : 'Validar comprobante'}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={clearFile} disabled={isSubmitting || !uploadedFile}>
              Limpiar archivo
            </SecondaryButton>
          </div>
        </form>
      </div>

      {isSubmitting ? (
        <LoadingState
          title="Estamos validando tu comprobante"
          message="Este proceso puede tomar unos segundos"
        />
      ) : null}

      {result ? <ValidationResultView result={result} /> : null}
    </div>
  );
};
