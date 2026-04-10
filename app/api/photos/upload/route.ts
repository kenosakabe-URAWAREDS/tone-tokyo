import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';
import { processImage } from '@/lib/image-processor';
import { readExif, reverseGeocode, findNearbyPlaces, generateGroupId } from '@/lib/exif-reader';

/**
 * POST /api/photos/upload
 *
 * Accepts multipart form data with one or more `photos` files (max 30).
 * Each photo goes through:
 *   1. EXIF reading (date, GPS, camera)
 *   2. Image processing (resize, tone correction)
 *   3. Reverse geocoding + nearby place lookup (when GPS available)
 *   4. Upload to Sanity assets
 *   5. Create a `photo` document in Sanity
 *
 * Returns { ok: true, photos: [...created doc summaries] }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];
    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 files per upload' }, { status: 400 });
    }

    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);

        // 1. Read EXIF
        const exif = await readExif(rawBuffer);

        // 2. Process image
        const processed = await processImage(rawBuffer);

        // 3. Reverse geocoding + nearby places
        let area: string | undefined;
        let placeName: string | undefined;
        let placeNameJa: string | undefined;
        let googlePlaceId: string | undefined;
        let placeCandidates: any[] = [];

        if (exif.latitude != null && exif.longitude != null) {
          const [geo, places] = await Promise.all([
            reverseGeocode(exif.latitude, exif.longitude),
            findNearbyPlaces(exif.latitude, exif.longitude),
          ]);
          area = geo.area;
          placeCandidates = places;
          if (places.length > 0) {
            placeName = places[0].name;
            placeNameJa = places[0].nameJa;
            googlePlaceId = places[0].placeId;
          }
        }

        // 4. Upload to Sanity
        const asset = await sanityWrite.assets.upload('image', processed, {
          filename: `photo-${Date.now()}-${i}.jpg`,
          contentType: 'image/jpeg',
        });

        // 5. Generate groupId
        const groupId = generateGroupId(googlePlaceId, exif.latitude, exif.longitude, exif.takenAt);

        // 6. Create photo document
        const doc = await sanityWrite.create({
          _type: 'photo',
          image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
          takenAt: exif.takenAt,
          latitude: exif.latitude,
          longitude: exif.longitude,
          placeName,
          placeNameJa,
          googlePlaceId,
          area,
          groupId,
          cameraModel: exif.cameraModel,
          isRecommended: false,
          uploadedAt: new Date().toISOString(),
          source: 'library',
          fileSize: rawBuffer.length,
        });

        results.push({
          _id: doc._id,
          imageUrl: asset.url,
          placeName,
          area,
          groupId,
          takenAt: exif.takenAt,
          placeCandidates,
        });
      } catch (e) {
        console.error(`Photo upload failed for file ${i}:`, e);
        results.push({ error: `File ${i} failed: ${e instanceof Error ? e.message : String(e)}` });
      }
    }

    return NextResponse.json({ ok: true, photos: results });
  } catch (error) {
    console.error('photos/upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
