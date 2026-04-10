/**
 * EXIF extraction + reverse geocoding + place lookup.
 *
 * Uses `exifr` to pull GPS coords, timestamp, and camera model
 * from uploaded images. When GPS data is present and
 * GOOGLE_MAPS_API_KEY is set, calls Places Nearby Search to find
 * the closest restaurant / shop. Gracefully degrades when either
 * piece is missing.
 */

import exifr from 'exifr';

export type ExifData = {
  takenAt?: string;       // ISO 8601
  latitude?: number;
  longitude?: number;
  cameraModel?: string;
};

export type PlaceCandidate = {
  name: string;
  nameJa?: string;
  placeId: string;
  address?: string;
  types?: string[];
};

export type GeoArea = {
  area?: string;          // district / neighborhood name
};

/**
 * Read EXIF metadata from an image buffer.
 */
export async function readExif(buffer: Buffer): Promise<ExifData> {
  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'Model', 'Make'],
    });
    if (!exif) return {};
    const dateRaw = exif.DateTimeOriginal || exif.CreateDate;
    const takenAt = dateRaw instanceof Date
      ? dateRaw.toISOString()
      : typeof dateRaw === 'string'
        ? new Date(dateRaw).toISOString()
        : undefined;
    const cameraModel = [exif.Make, exif.Model].filter(Boolean).join(' ') || undefined;
    return {
      takenAt: takenAt && !isNaN(new Date(takenAt).getTime()) ? takenAt : undefined,
      latitude: typeof exif.latitude === 'number' ? exif.latitude : undefined,
      longitude: typeof exif.longitude === 'number' ? exif.longitude : undefined,
      cameraModel,
    };
  } catch (e) {
    console.error('exif-reader: parse failed', e);
    return {};
  }
}

/**
 * Reverse-geocode GPS coords into a rough area name using
 * Google Maps Geocoding API.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoArea> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return {};
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return {};
    // Find the most specific locality / sublocality
    for (const result of data.results) {
      for (const comp of result.address_components || []) {
        if (
          comp.types?.includes('sublocality_level_1') ||
          comp.types?.includes('sublocality') ||
          comp.types?.includes('locality')
        ) {
          return { area: comp.long_name };
        }
      }
    }
    return {};
  } catch (e) {
    console.error('reverseGeocode failed:', e);
    return {};
  }
}

/**
 * Find nearby places using Google Maps Places Nearby Search.
 * Returns up to 5 candidates sorted by distance.
 */
export async function findNearbyPlaces(
  lat: number,
  lng: number
): Promise<PlaceCandidate[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=50&type=restaurant|cafe|bar|store|food` +
      `&language=ja&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return [];
    return data.results.slice(0, 5).map((p: any) => ({
      name: p.name,
      placeId: p.place_id,
      address: p.vicinity,
      types: p.types,
    }));
  } catch (e) {
    console.error('findNearbyPlaces failed:', e);
    return [];
  }
}

/**
 * Generate a group ID for a photo based on placeId, or fallback to
 * proximity (50m radius + 2hr window).
 */
export function generateGroupId(
  placeId?: string,
  lat?: number,
  lng?: number,
  takenAt?: string
): string | undefined {
  if (placeId) return `place-${placeId}`;
  if (lat != null && lng != null && takenAt) {
    // Round to ~50m grid + 2hr time bucket
    const latBucket = Math.round(lat * 1000) / 1000;
    const lngBucket = Math.round(lng * 1000) / 1000;
    const timeBucket = Math.floor(new Date(takenAt).getTime() / (2 * 60 * 60 * 1000));
    return `geo-${latBucket}-${lngBucket}-${timeBucket}`;
  }
  return undefined;
}
