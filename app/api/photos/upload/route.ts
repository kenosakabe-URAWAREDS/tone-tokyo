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
    const contentType = req.headers.get('content-type') || '';

    // JSON body path: client already uploaded to Sanity, just create photo doc
    if (contentType.includes('application/json')) {
      return handleAssetIdUpload(req);
    }

    // Legacy formData path
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

/**
 * Handle JSON body with { assetId, filename }.
 * The image was already uploaded directly to Sanity from the browser.
 * We fetch the asset to get its URL, then create the photo document.
 */
async function handleAssetIdUpload(req: NextRequest) {
  try {
    const { assetId, filename } = await req.json();
    if (!assetId) {
      return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
    }

    // Fetch asset info from Sanity
    const asset = await sanityWrite.fetch(`*[_id == $id][0]{ _id, url }`, { id: assetId });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found in Sanity' }, { status: 404 });
    }

    // Try to read EXIF from the uploaded asset by fetching its URL
    let exif: any = {};
    try {
      const imgRes = await fetch(asset.url as string);
      const imgBuf = Buffer.from(await imgRes.arrayBuffer());
      exif = await readExif(imgBuf);
    } catch (e) {
      console.warn('[photos/upload] EXIF read from asset failed:', e);
    }

    // Reverse geocoding
    let area: string | undefined;
    let placeName: string | undefined;
    let placeNameJa: string | undefined;
    let googlePlaceId: string | undefined;

    if (exif.latitude != null && exif.longitude != null) {
      try {
        const [geo, places] = await Promise.all([
          reverseGeocode(exif.latitude, exif.longitude),
          findNearbyPlaces(exif.latitude, exif.longitude),
        ]);
        area = geo.area;
        if (places.length > 0) {
          placeName = places[0].name;
          placeNameJa = places[0].nameJa;
          googlePlaceId = places[0].placeId;
        }
      } catch (geoErr) {
        console.warn('[photos/upload] Geocoding failed:', geoErr);
      }
    }

    const groupId = generateGroupId(googlePlaceId, exif.latitude, exif.longitude, exif.takenAt);

    const doc = await sanityWrite.create({
      _type: 'photo',
      image: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
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
    });

    return NextResponse.json({ ok: true, photoDocId: doc._id });
  } catch (error) {
    console.error('photos/upload (assetId) error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
