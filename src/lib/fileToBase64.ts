export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string | null;
      if (!result || !result.includes(',')) {
        reject(new Error('No fue posible convertir el archivo.'));
        return;
      }

      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('No fue posible obtener el contenido base64.'));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Error leyendo el archivo.'));
    reader.readAsDataURL(file);
  });
