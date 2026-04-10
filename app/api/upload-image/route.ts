import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';
import { processImage } from '@/lib/image-processor';
import { readExif, reverseGeocode, findNearbyPlaces, generateGroupId } from '@/lib/exif-reader';
import type { ExifData } from '@/lib/exif-reader';

/** Strip any data-URI prefix and return raw base64 + detected mime type. */
function parseBase64Image(input: string): { base64: string; mimeType: string } {
  const match = input.match(/^data:(image\/[^;]+);base64,/);
  if (match) {
    return { base64: input.slice(match[0].length), mimeType: match[1] };
  }
  // No prefix — assume JPEG (most common from canvas.toDataURL)
  return { base64: input, mimeType: 'image/jpeg' };
}

export async function POST(req: NextRequest) {
  try {
    const { image, filename, createPhotoDoc } = await req.json();

    if (!image) {
      console.error('[upload-image] No image in request body');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.SANITY_WRITE_TOKEN) {
      console.error('[upload-image] SANITY_WRITE_TOKEN is not set');
      return NextResponse.json({ error: 'Server misconfiguration: missing Sanity token' }, { status: 500 });
    }

    console.log(`[upload-image] Received image, filename="${filename}", createPhotoDoc=${!!createPhotoDoc}, data length=${image.length}`);

    const { base64, mimeType } = parseBase64Image(image);
    const rawBuffer = Buffer.from(base64, 'base64');
    console.log(`[upload-image] Decoded base64 → rawBuffer size=${rawBuffer.length} bytes, mimeType=${mimeType}`);

    if (rawBuffer.length === 0) {
      console.error('[upload-image] Decoded buffer is empty');
      return NextResponse.json({ error: 'Image decode resulted in empty buffer' }, { status: 400 });
    }

    // EXIF — best effort, never block upload
    let exifData: ExifData = {};
    if (createPhotoDoc) {
      try {
        exifData = await readExif(rawBuffer);
        console.log(`[upload-image] EXIF: takenAt=${exifData.takenAt}, lat=${exifData.latitude}, lng=${exifData.longitude}, camera=${exifData.cameraModel}`);
      } catch (e) {
        console.warn('[upload-image] EXIF read failed (continuing without metadata):', e);
      }
    }

    // Process image — best effort, fall back to raw buffer
    let buffer: Buffer;
    try {
      buffer = await processImage(rawBuffer);
      console.log(`[upload-image] After processImage → buffer size=${buffer.length} bytes`);
    } catch (e) {
      console.warn('[upload-image] processImage failed, using raw buffer:', e);
      buffer = rawBuffer;
    }

    const ext = mimeType === 'image/png' ? '.png' : '.jpg';
    const uploadFilename = (filename || 'photo') + ext;
    console.log(`[upload-image] Uploading to Sanity as "${uploadFilename}" (${mimeType})...`);

    // Try upload with processed buffer; if Sanity rejects it, retry with raw buffer
    let asset: any;
    try {
      asset = await sanityWrite.assets.upload('image', buffer, {
        filename: uploadFilename,
        contentType: mimeType,
      });
    } catch (uploadErr: any) {
      console.warn(`[upload-image] Sanity rejected processed buffer: ${uploadErr?.message}. Retrying with raw buffer...`);
      asset = await sanityWrite.assets.upload('image', rawBuffer, {
        filename: uploadFilename,
      });
    }

    console.log(`[upload-image] Sanity upload success: _id=${asset._id}, url=${asset.url}`);

    // Optionally create a photo document (for photo library)
    let photoDoc: any = null;
    if (createPhotoDoc) {
      try {
        let area: string | undefined;
        let placeName: string | undefined;
        let placeNameJa: string | undefined;
        let googlePlaceId: string | undefined;

        if (exifData.latitude != null && exifData.longitude != null) {
          try {
            const [geo, places] = await Promise.all([
              reverseGeocode(exifData.latitude, exifData.longitude),
              findNearbyPlaces(exifData.latitude, exifData.longitude),
            ]);
            area = geo.area;
            if (places.length > 0) {
              placeName = places[0].name;
              placeNameJa = places[0].nameJa;
              googlePlaceId = places[0].placeId;
            }
          } catch (geoErr) {
            console.warn('[upload-image] Geocoding failed (continuing):', geoErr);
          }
        }

        const groupId = generateGroupId(googlePlaceId, exifData.latitude, exifData.longitude, exifData.takenAt);

        photoDoc = await sanityWrite.create({
          _type: 'photo',
          image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
          takenAt: exifData.takenAt,
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          placeName,
          placeNameJa,
          googlePlaceId,
          area,
          groupId,
          cameraModel: exifData.cameraModel,
          isRecommended: false,
          uploadedAt: new Date().toISOString(),
          source: 'library',
          fileSize: rawBuffer.length,
        });
        console.log(`[upload-image] Photo doc created: _id=${photoDoc._id}, groupId=${groupId}`);
      } catch (docErr) {
        console.error('[upload-image] Photo doc creation failed (asset was uploaded):', docErr);
      }
    }

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
      photoDocId: photoDoc?._id,
    });
  } catch (error: any) {
    console.error('[upload-image] Upload failed:', error?.message || error);
    console.error('[upload-image] Full error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
