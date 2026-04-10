import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, isAuthCookieValid } from '@/lib/editor-auth';
import { redirect } from 'next/navigation';
import AboutClient from './AboutClient';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!isAuthCookieValid(cookie)) {
    redirect('/editor');
  }
  return <AboutClient />;
}
