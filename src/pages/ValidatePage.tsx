import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePreviewCard } from '../components/ui/FilePreviewCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';
import { SecondaryButton } from '../components/ui/SecondaryButton';
import { UploadDropzone } from '../components/ui/UploadDropzone';
import { uploadReceipt } from '../lib/api';
import { useFileUpload } from '../hooks/useFileUpload';

export const ValidatePage = () => {
  const navigate = useNavigate();
  const { uploadedFile, isImage, error, setFile, clearFile } = useFileUpload();
  const [expectedAmount, setExpectedAmount] = useState('');
  const [expectedReference, setExpectedReference] = useState('');
  const [expectedBank, setExpectedBank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!uploadedFile) {
      setFormError('Debes cargar un comprobante para iniciar la validación.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { fileToken } = await uploadReceipt({
        file: uploadedFile,
        expectedAmount,
        expectedReference,
        expectedBank,
      });

      navigate('/procesando', {
        state: {
          fileToken,
          payload: {
            file: uploadedFile,
            expectedAmount,
            expectedReference,
            expectedBank,
          },
        },
      });
    } catch {
      setFormError('No pudimos iniciar la validación en este momento. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SectionTitle
        eyebrow="Nueva solicitud"
        title="Cargar comprobante"
        description="Adjunta el archivo y, si lo deseas, completa los campos de referencia para mejorar la precisión de la validación."
      />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-panel sm:p-8">
        <UploadDropzone onFileSelected={setFile} error={error} />

        {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={clearFile} /> : null}

        <fieldset className="grid gap-4 md:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold text-brand-900">Datos de apoyo (opcionales)</legend>

          <div>
            <label htmlFor="expectedAmount" className="mb-2 block text-sm font-medium text-brand-900">
              Monto esperado
            </label>
            <input
              id="expectedAmount"
              type="text"
              value={expectedAmount}
              onChange={(event) => setExpectedAmount(event.target.value)}
              placeholder="Ej. Bs. 2.450,00"
              className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="expectedReference" className="mb-2 block text-sm font-medium text-brand-900">
              Referencia esperada
            </label>
            <input
              id="expectedReference"
              type="text"
              value={expectedReference}
              onChange={(event) => setExpectedReference(event.target.value)}
              placeholder="Ej. 845120"
              className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="expectedBank" className="mb-2 block text-sm font-medium text-brand-900">
              Banco esperado
            </label>
            <input
              id="expectedBank"
              type="text"
              value={expectedBank}
              onChange={(event) => setExpectedBank(event.target.value)}
              placeholder="Ej. Banco Mercantil"
              className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </fieldset>

        {formError ? <p className="text-sm font-medium text-danger">{formError}</p> : null}

        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="submit" disabled={!uploadedFile || isSubmitting}>
            {isSubmitting ? 'Preparando validación...' : 'Validar comprobante'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => navigate('/')}>
            Volver
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
};
