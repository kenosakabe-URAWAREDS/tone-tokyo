import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Cookie-based auth for the /editor admin app.
 *
 * EDITOR_PASSWORD lives in Vercel env. The cookie stores an HMAC of
 * a fixed magic string keyed by the password — not the password
 * itself — so reading the cookie can't reveal the secret. Verifying
 * is timing-safe. The cookie's own maxAge enforces the 24h session
 * window.
 */

const COOKIE_NAME = 'tone_editor_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

function tokenFor(password: string): string {
  return createHmac('sha256', password).update('tone-tokyo-editor-v1').digest('hex');
}

export function isAuthCookieValid(cookieValue: string | undefined | null): boolean {
  const password = process.env.EDITOR_PASSWORD || '';
  if (!password || !cookieValue) return false;
  const expected = tokenFor(password);
  if (cookieValue.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(cookieValue, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export function checkPassword(submitted: string): boolean {
  const password = process.env.EDITOR_PASSWORD || '';
  if (!password || !submitted) return false;
  if (submitted.length !== password.length) return false;
  try {
    return timingSafeEqual(Buffer.from(submitted, 'utf8'), Buffer.from(password, 'utf8'));
  } catch {
    return false;
  }
}

export function buildAuthCookie(): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    sameSite: 'lax';
    secure: boolean;
    path: string;
    maxAge: number;
  };
} {
  const password = process.env.EDITOR_PASSWORD || '';
  return {
    name: COOKIE_NAME,
    value: tokenFor(password),
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    },
  };
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
