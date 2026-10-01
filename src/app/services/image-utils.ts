/**
 * Lee una imagen elegida por el usuario (galería o cámara) y la devuelve
 * como data URL JPEG reducida a `maxSize` px en su lado más largo.
 *
 * Las fotos de la cámara del celular pesan 3-5 MB; como las fotos viajan
 * en base64 dentro del JSON (límite de 15 MB en el backend), unas pocas
 * sin reducir hacían fallar la publicación. Reducidas quedan en ~150-300 KB.
 */
export function readImageAsResizedDataUrl(file: File, maxSize = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }

      context.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('El archivo no es una imagen válida.'));
    };

    img.src = url;
  });
}
