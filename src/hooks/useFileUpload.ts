import { useMemo, useState } from 'react';
import type { UploadedFile } from '../types/validation';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf', 'application/x-pdf'];

export const useFileUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string>('');

  const isImage = useMemo(
    () => Boolean(uploadedFile?.type.startsWith('image/')),
    [uploadedFile?.type],
  );

  const clearFile = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setError('');
  };

  const setFile = (file: File | null) => {
    if (!file) {
      setError('Seleccione un archivo de imagen o PDF para continuar.');
      return;
    }

    const isAccepted = ACCEPTED_TYPES.includes(file.type);
    if (!isAccepted) {
      setError('Formato no permitido. Cargue un archivo JPG, JPEG, PNG, WEBP o PDF.');
      return;
    }

    const maxSizeMb = 12;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError('El archivo excede el límite de 12 MB.');
      return;
    }

    setError('');
    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    });
  };

  return {
    uploadedFile,
    isImage,
    error,
    setFile,
    clearFile,
  };
};
