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
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!uploadedFile) {
      setFormError('Debes cargar un comprobante para iniciar la validación.');
      return;
    }
    if (!idNumber.trim()) {
      setFormError('Ingresa tu número de cédula.');
      return;
    }
    if (!fullName.trim()) {
      setFormError('Ingresa tu nombre completo.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { fileToken } = await uploadReceipt({
        file: uploadedFile,
        idNumber: idNumber.trim(),
        fullName: fullName.trim(),
      });

      navigate('/procesando', {
        state: {
          fileToken,
          payload: {
            file: uploadedFile,
            idNumber: idNumber.trim(),
            fullName: fullName.trim(),
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
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel md:grid md:grid-cols-[0.88fr_1.12fr]">
        <aside className="bg-brand-700 px-8 py-10 text-white sm:px-10 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Nueva validación</p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">Cargue su comprobante</h2>
          <p className="mt-4 text-lg leading-8 text-white/90">
            Ingrese sus datos para identificar la solicitud. El sistema completará automáticamente los demás datos.
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
            eyebrow="Formulario de cliente"
            title="Datos de la validación"
            description="Complete los campos requeridos y adjunte el archivo del comprobante."
          />

          <fieldset className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="idNumber" className="mb-2 block text-sm font-medium text-brand-900">
                Cédula
              </label>
              <input
                id="idNumber"
                type="text"
                value={idNumber}
                onChange={(event) => setIdNumber(event.target.value)}
                placeholder="Ej. V-12345678"
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-brand-900">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Ej. María Fernanda Pérez"
                className="w-full rounded-md border border-border px-4 py-3 text-sm text-brand-900 placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </fieldset>

          <UploadDropzone onFileSelected={setFile} error={error} />

          {uploadedFile ? <FilePreviewCard uploadedFile={uploadedFile} isImage={isImage} onRemove={clearFile} /> : null}

          {formError ? <p className="text-sm font-medium text-danger">{formError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <PrimaryButton type="submit" disabled={!uploadedFile || isSubmitting} className="px-7">
              {isSubmitting ? 'Preparando validación...' : 'Validar comprobante'}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => navigate('/')}>
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};
