import { NextResponse } from 'next/server';

/**
 * Returns the Sanity write token so the authenticated editor client
 * can upload images directly to the Sanity Assets API, bypassing the
 * Vercel body-size limit.
 *
 * Protected by the proxy (middleware) — only accessible with a valid
 * editor auth cookie.
 */
export async function GET() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'SANITY_WRITE_TOKEN not configured' }, { status: 500 });
  }
  return NextResponse.json({ token });
}
