import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthCookieValid, AUTH_COOKIE_NAME } from '@/lib/editor-auth';

/**
 * Next 16 file convention: this used to be `middleware.ts`. Same
 * mechanism — runs on every matched request before the route handler.
 *
 * Guards /editor and /api/editor/* with the cookie-based auth from
 * lib/editor-auth.ts. /editor itself is excluded because that page
 * server-renders the login form when no cookie is present, so the
 * gate is just the absence of cookie → render login. Subroutes and
 * APIs use this proxy to redirect/reject unauthenticated requests.
 *
 * Login and logout endpoints are excluded so the user can actually
 * authenticate without already being authenticated.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public exemptions inside the matched namespace.
  if (
    pathname === '/api/editor/login' ||
    pathname === '/api/editor/logout' ||
    pathname === '/editor'
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (isAuthCookieValid(cookie)) {
    return NextResponse.next();
  }

  // API caller: respond with 401 JSON, no redirect.
  if (pathname.startsWith('/api/editor/')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'cache-control': 'no-store' } }
    );
  }

  // Page navigation: bounce back to /editor (login form lives there).
  const loginUrl = new URL('/editor', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/editor/:path*', '/api/editor/:path*'],
};
