import { useRef, useState, type DragEvent } from 'react';
import { cn } from '../../lib/utils';

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
          'rounded-xl border-2 border-dashed bg-white p-8 text-center transition',
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-border',
          error ? 'border-danger bg-danger/5' : '',
        )}
      >
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20 16.5a4.5 4.5 0 0 0-2.2-8.4 6 6 0 0 0-11.5 1.9A4 4 0 0 0 6 18h12a2 2 0 0 0 2-1.5z" />
            <path d="M12 16V9" />
            <path d="m9.5 11.5 2.5-2.5 2.5 2.5" />
          </svg>
        </div>

        <p className="mt-3 text-[1.95rem] leading-tight text-text sm:text-[2.15rem]">Suba su comprobante</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted">
          Arrastre y suelte su archivo aquí o selecciónelo manualmente.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-2xl border border-brand-300 bg-white px-8 py-3 text-base font-semibold text-brand-500 transition hover:bg-brand-50"
          >
            Adjuntar comprobante
          </button>
        </div>

        <div className="mt-4 text-sm text-muted">
          Solo PDF, JPG, PNG, WEBP. Máximo 12 MB.
        </div>
        <input
          aria-label="Seleccionar archivo de comprobante"
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </section>
  );
};
