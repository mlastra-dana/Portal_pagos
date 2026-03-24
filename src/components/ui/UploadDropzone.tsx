import { useRef, useState, type DragEvent } from 'react';
import { cn } from '../../lib/utils';
import { PrimaryButton } from './PrimaryButton';

interface UploadDropzoneProps {
  onFileSelected: (file: File | null) => void;
  error?: string;
}

export const UploadDropzone = ({ onFileSelected, error }: UploadDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onFileSelected(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <section aria-label="Carga de archivo" className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-lg border-2 border-dashed bg-white p-8 text-center transition',
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-border',
          error ? 'border-danger bg-danger/5' : '',
        )}
      >
        <p className="text-sm font-semibold text-brand-800">Arrastra y suelta tu comprobante aquí</p>
        <p className="mt-2 text-sm text-muted">Formatos permitidos: JPG, PNG o PDF (máximo 8 MB)</p>
        <div className="mt-6">
          <PrimaryButton type="button" onClick={() => inputRef.current?.click()}>
            Seleccionar archivo
          </PrimaryButton>
        </div>
        <input
          aria-label="Seleccionar archivo de comprobante"
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,application/pdf"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </section>
  );
};
