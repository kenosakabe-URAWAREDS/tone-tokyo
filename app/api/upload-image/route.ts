import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { processImage } from '@/lib/image-processor';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { image, filename } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64, 'base64');
    const buffer = await processImage(rawBuffer);

    const asset = await sanity.assets.upload('image', buffer, {
      filename: (filename || 'photo') + '.jpg',
      contentType: 'image/jpeg',
    });

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
