import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, buildAuthCookie } from '@/lib/editor-auth';

export async function POST(req: NextRequest) {
  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!process.env.EDITOR_PASSWORD) {
    return NextResponse.json(
      { error: 'EDITOR_PASSWORD is not configured on the server' },
      { status: 500 }
    );
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  }

  const cookie = buildAuthCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
