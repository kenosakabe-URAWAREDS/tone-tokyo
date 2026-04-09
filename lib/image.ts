/**
 * Inject width / quality params into an image URL.
 *
 * Our GROQ queries already collapse `heroImage` to a URL string via
 *   "heroImage": coalesce(heroImage.asset->url, heroImageUrl)
 * so we can't hand the value to `@sanity/image-url`'s builder (which
 * needs the raw asset reference). Instead we mutate the URL's query
 * string — works for the two CDNs we actually serve from:
 *
 *   - Sanity CDN (cdn.sanity.io) — its image pipeline reads ?w=, ?q=,
 *     ?auto=format, ?fit=max from any asset URL.
 *   - Unsplash and other source URLs — we set/replace ?w= and ?q=.
 *
 * If a future article uses a host whose image transforms work
 * differently, the worst case is the URL passes through unchanged.
 */
export function sizedImage(
  url: string | undefined | null,
  width: number,
  quality = 80
): string {
  if (!url) return "";

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  u.searchParams.set("w", String(width));
  u.searchParams.set("q", String(quality));

  if (u.hostname.includes("cdn.sanity.io")) {
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "max");
  }

  return u.toString();
}
