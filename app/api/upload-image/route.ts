import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';
import { processImage } from '@/lib/image-processor';

export async function POST(req: NextRequest) {
  try {
    const { image, filename } = await req.json();

    if (!image) {
      console.error('[upload-image] No image in request body');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.SANITY_WRITE_TOKEN) {
      console.error('[upload-image] SANITY_WRITE_TOKEN is not set');
      return NextResponse.json({ error: 'Server misconfiguration: missing Sanity token' }, { status: 500 });
    }

    console.log(`[upload-image] Received image, filename="${filename}", data length=${image.length}`);

    const base64 = image.replace(/^data:image\/\w+;base64,/, '');
    const rawBuffer = Buffer.from(base64, 'base64');
    console.log(`[upload-image] Decoded base64 → rawBuffer size=${rawBuffer.length} bytes`);

    if (rawBuffer.length === 0) {
      console.error('[upload-image] Decoded buffer is empty');
      return NextResponse.json({ error: 'Image decode resulted in empty buffer' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
    });
  } catch (error: any) {
    console.error('[upload-image] Upload failed:', error?.message || error);
    console.error('[upload-image] Full error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
