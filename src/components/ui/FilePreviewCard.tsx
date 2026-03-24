import type { UploadedFile } from '../../types/validation';
import { formatFileSize } from '../../lib/utils';
import { SecondaryButton } from './SecondaryButton';

interface FilePreviewCardProps {
  uploadedFile: UploadedFile;
  isImage: boolean;
  onRemove: () => void;
}

export const FilePreviewCard = ({ uploadedFile, isImage, onRemove }: FilePreviewCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-brand-900">{uploadedFile.name}</p>
          <p className="text-sm text-muted">{formatFileSize(uploadedFile.size)}</p>
        </div>
        <SecondaryButton type="button" onClick={onRemove} className="px-3 py-2 text-xs">
          Quitar
        </SecondaryButton>
      </div>

      <div className="mt-4 rounded-md border border-border bg-bg p-3">
        {isImage && uploadedFile.previewUrl ? (
          <img
            src={uploadedFile.previewUrl}
            alt={`Vista previa de ${uploadedFile.name}`}
            className="max-h-56 w-auto rounded-md object-contain"
          />
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
