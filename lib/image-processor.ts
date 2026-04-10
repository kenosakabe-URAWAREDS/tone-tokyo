/**
 * Server-side image processing pipeline.
 *
 * Uses sharp when available for consistent TONE TOKYO image tone.
 * If sharp cannot be loaded (e.g. missing native binaries on some
 * deploy targets), every function gracefully returns the original
 * buffer so uploads never break.
 *
 * sharp is loaded via createRequire to hide it from the bundler.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
let _sharp: any = null;
let _sharpChecked = false;

function getSharp(): any {
  if (_sharpChecked) return _sharp;
  _sharpChecked = true;
  try {
    const { createRequire } = require('module');
    const req = createRequire(__filename);
    _sharp = req('sharp');
  } catch {
    console.warn('image-processor: sharp not available — images will be uploaded without processing');
    _sharp = null;
  }
  return _sharp;
}

export async function processImage(input: Buffer): Promise<Buffer> {
  const sharp = getSharp();
  if (!sharp) return input;
  try {
    return await sharp(input)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .normalize()
      .modulate({ brightness: 1.02, saturation: 0.92 })
      .gamma(1.1)
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (e) {
    console.error('image-processor: sharp failed, returning original', e);
    return input;
  }
}

export async function processImageForInstagram(input: Buffer): Promise<Buffer> {
  const sharp = getSharp();
  if (!sharp) return input;
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
