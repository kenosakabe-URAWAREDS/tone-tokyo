import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';
import { processImage } from '@/lib/image-processor';
import { readExif, reverseGeocode, findNearbyPlaces, generateGroupId } from '@/lib/exif-reader';

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

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64, 'base64');
    console.log(`[upload-image] Decoded base64 → rawBuffer size=${rawBuffer.length} bytes`);

    if (rawBuffer.length === 0) {
      console.error('[upload-image] Decoded buffer is empty');
      return NextResponse.json({ error: 'Image decode resulted in empty buffer' }, { status: 400 });
    }

    // Read EXIF before processing (processing may strip it)
    let exifData: Awaited<ReturnType<typeof readExif>> = {};
    if (createPhotoDoc) {
      exifData = await readExif(rawBuffer);
      console.log(`[upload-image] EXIF: takenAt=${exifData.takenAt}, lat=${exifData.latitude}, lng=${exifData.longitude}, camera=${exifData.cameraModel}`);
    }

    const buffer = await processImage(rawBuffer);
    console.log(`[upload-image] After processImage → buffer size=${buffer.length} bytes`);

    const uploadFilename = (filename || 'photo') + '.jpg';
    console.log(`[upload-image] Uploading to Sanity as "${uploadFilename}"...`);

    const asset = await sanityWrite.assets.upload('image', buffer, {
      filename: uploadFilename,
      contentType: 'image/jpeg',
    });

    console.log(`[upload-image] Sanity upload success: _id=${asset._id}, url=${asset.url}`);

    // Optionally create a photo document (for photo library)
    let photoDoc: any = null;
    if (createPhotoDoc) {
      let area: string | undefined;
      let placeName: string | undefined;
      let placeNameJa: string | undefined;
      let googlePlaceId: string | undefined;

      if (exifData.latitude != null && exifData.longitude != null) {
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
