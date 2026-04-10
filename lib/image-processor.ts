/**
 * Server-side image processing pipeline using sharp.
 *
 * All uploaded images pass through processImage() for consistent
 * tone and sizing before being stored in Sanity:
 *   1. Auto-rotate from EXIF orientation
 *   2. Resize (longest side ≤ 2000 px, preserve aspect ratio)
 *   3. normalize + modulate + gamma for the TONE TOKYO look
 *      (slightly warm, slightly desaturated — Kinfolk / Popeye feel)
 *   4. Output as JPEG quality 85
 *
 * If sharp throws for any reason, the original buffer is returned
 * unchanged so the upload still succeeds.
 */

import sharp from 'sharp';

export async function processImage(input: Buffer): Promise<Buffer> {
  try {
    const processed = await sharp(input)
      .rotate() // auto-rotate from EXIF
      .resize({
        width: 2000,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .normalize() // auto brightness / contrast
      .modulate({ brightness: 1.02, saturation: 0.92 })
      .gamma(1.1) // lift shadows slightly (dark interiors)
      .jpeg({ quality: 85 })
      .toBuffer();
    return processed;
  } catch (e) {
    console.error('image-processor: sharp failed, returning original', e);
    return input;
  }
}

/**
 * Resize an image to a 1080×1080 square (center crop) for Instagram.
 */
export async function processImageForInstagram(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input)
      .rotate()
      .resize(1080, 1080, { fit: 'cover', position: 'centre' })
      .normalize()
      .modulate({ brightness: 1.02, saturation: 0.92 })
      .gamma(1.1)
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch (e) {
    console.error('image-processor: IG resize failed', e);
    return input;
  }
}
