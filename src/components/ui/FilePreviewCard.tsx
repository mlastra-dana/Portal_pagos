import type { UploadedFile } from '../../types/validation';
import { formatFileSize } from '../../lib/utils';

interface FilePreviewCardProps {
  uploadedFile: UploadedFile;
  isImage: boolean;
  onRemove: () => void;
}

export const FilePreviewCard = ({ uploadedFile, isImage, onRemove }: FilePreviewCardProps) => {
  const typeLabel = uploadedFile.type === 'application/pdf' ? 'PDF' : 'Imagen';
  const isPdf = uploadedFile.type === 'application/pdf' || uploadedFile.type === 'application/x-pdf';

  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">{uploadedFile.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted">{formatFileSize(uploadedFile.size)}</p>
            <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              {typeLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar archivo"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg font-semibold leading-none text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
        >
          ×
        </button>
      </div>

      <div className="mt-3 rounded-md border border-border bg-bg p-2">
        {isImage && uploadedFile.previewUrl ? (
          <img
            src={uploadedFile.previewUrl}
            alt={`Vista previa de ${uploadedFile.name}`}
            className="max-h-36 w-auto rounded-md object-contain"
          />
        ) : isPdf && uploadedFile.previewUrl ? (
          <object
            data={uploadedFile.previewUrl}
            type="application/pdf"
            className="h-[320px] w-full rounded-md"
          >
            <div className="flex items-center gap-3 text-sm text-brand-800">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-100">PDF</span>
              <span>Vista previa no disponible. Abra el PDF desde su navegador.</span>
            </div>
          </object>
        ) : (
          <div className="flex items-center gap-3 text-sm text-brand-800">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-100">PDF</span>
            <span>Documento PDF listo para validación</span>
          </div>
        )}
      </div>
    </div>
  );
};
