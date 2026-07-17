/**
 * compressImage — client-side image normalization for uploads.
 *
 * Oversized picks (phone photos are routinely 6–15MB) are downscaled and
 * re-encoded in the browser so the user never sees the 4MB wall. Files
 * already small enough pass through untouched. Runs only in the browser
 * (canvas + createImageBitmap); on any failure the original file is
 * returned and the caller's existing size check handles it.
 */

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const TARGET_BYTES = 3.5 * 1024 * 1024; // comfortably under the 4MB API limit
// Step down dimensions until the encode fits — 2000px is plenty for the
// full-bleed hero slides (1080x1350); smaller edges are the escape hatch
// for pathological inputs that won't compress at full size.
const EDGES = [2000, 1600, 1280, 1000, 800];

function renamed(name: string, mime: string): string {
  const ext = mime === 'image/webp' ? 'webp' : 'jpg';
  return name.replace(/\.[^.]+$/, '') + '.' + ext;
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= TARGET_BYTES && ACCEPTED.includes(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    } as ImageBitmapOptions);

    for (const edge of EDGES) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, w, h);

      for (const quality of [0.82, 0.65, 0.5]) {
        // WebP first; Safari <16 returns null for WebP, fall back to JPEG.
        const blob =
          (await encode(canvas, 'image/webp', quality)) ??
          (await encode(canvas, 'image/jpeg', quality));
        if (blob && blob.size <= TARGET_BYTES) {
          bitmap.close();
          return new File([blob], renamed(file.name, blob.type), { type: blob.type });
        }
      }
    }
    bitmap.close();
    return file;
  } catch {
    return file;
  }
}
