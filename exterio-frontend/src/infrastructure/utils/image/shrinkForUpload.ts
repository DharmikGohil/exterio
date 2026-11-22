/**
 * Makes a phone photo small enough to upload quickly on an ordinary connection, without changing
 * what the server sees. The server analyses and stores photos at 1600 px on the long side, so a
 * copy at 2400 px loses nothing it uses, while a 12 MB phone photo becomes about 1 MB. The photo
 * is turned upright from its EXIF orientation first. Anything that goes wrong (an old browser, an
 * unreadable file) sends the original instead: shrinking is a speed-up, never a requirement.
 */

/** Long side of the uploaded copy; comfortably above the server's 1600 px working size. */
export const UPLOAD_LONG_SIDE_PX = 2400;
/** Files this small are sent as they are. */
export const SHRINK_ABOVE_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.9;

/** The size to draw a photo at so its long side is at most `longSide`. */
export function fitWithin(
  width: number,
  height: number,
  longSide = UPLOAD_LONG_SIDE_PX
): { width: number; height: number } {
  const scale = Math.min(1, longSide / Math.max(width, height, 1));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function shrinkForUpload(file: File): Promise<File> {
  if (file.size <= SHRINK_ABOVE_BYTES || typeof createImageBitmap !== 'function') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const size = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) {
      return file;
    }
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}
