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
          'rounded-md border-2 border-dashed bg-white p-8 text-center transition',
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-border',
          error ? 'border-danger bg-danger/5' : '',
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Carga segura</p>
        <p className="mt-2 text-base font-semibold text-brand-900">Arrastra y suelta tu comprobante aquí</p>
        <p className="mt-3 text-xs text-muted">También puedes seleccionar manualmente desde tu dispositivo.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-brand-700">
          <span className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5">JPG</span>
          <span className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5">PNG</span>
          <span className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5">WEBP</span>
          <span className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5">PDF</span>
          <span className="rounded-full border border-brand-200 bg-white px-2.5 py-0.5">Hasta 8 MB</span>
        </div>
        <div className="mt-6">
          <PrimaryButton type="button" onClick={() => inputRef.current?.click()} className="px-5 py-2.5 text-sm">
            Seleccionar archivo
          </PrimaryButton>
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
