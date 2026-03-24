import { useMemo, useState } from 'react';
import type { UploadedFile } from '../types/validation';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

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
      setError('Selecciona un archivo de imagen o PDF para continuar.');
      return;
    }

    const isAccepted = ACCEPTED_TYPES.includes(file.type);
    if (!isAccepted) {
      setError('Formato no permitido. Carga un archivo JPG, JPEG, PNG, WEBP o PDF.');
      return;
    }

    const maxSizeMb = 8;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError('El archivo excede el límite de 8 MB.');
      return;
    }

    setError('');
    setUploadedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
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
