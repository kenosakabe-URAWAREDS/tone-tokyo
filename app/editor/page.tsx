import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, isAuthCookieValid } from '@/lib/editor-auth';
import EditorLogin from './EditorLogin';
import EditorDashboard from './EditorDashboard';

// /editor is the only public-ish entry point — proxy.ts deliberately
// lets it through so the login form can render. Cookie validity is
// checked here on the server and we render either the login or the
// dashboard accordingly.
export const dynamic = 'force-dynamic';

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const authed = isAuthCookieValid(cookie);

  if (!authed) {
    return <EditorLogin nextUrl={sp.next} />;
  }
  return <EditorDashboard />;
}
