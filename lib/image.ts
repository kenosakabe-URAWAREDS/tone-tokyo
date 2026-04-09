import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./sanity";

const builder = createImageUrlBuilder(client);

/**
 * Inject width / quality params into a plain image URL.
 *
 * Used as the fallback path when we *don't* have a Sanity image
 * reference (e.g. an Unsplash placeholder URL or a `heroImageUrl`
 * supplied by hand). Mutates the URL's query string via the URL
 * constructor:
 *
 *   - Sanity CDN (cdn.sanity.io): also sets auto=format & fit=max,
 *     which the Sanity image pipeline reads from any asset URL.
 *   - Other CDNs (Unsplash, etc.): just sets ?w=&q=.
 *
 * Prefer `urlForArticleImage` for hero/card art — it honors the crop
 * and hotspot the editor set in Sanity Studio, which `sizedImage` on
 * the raw asset URL cannot do.
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

type ArticleImageSource = {
  /** Raw Sanity image object (with crop & hotspot). Pulled into the
   *  GROQ query as `"heroImageRef": heroImage`. Preferred when set. */
  heroImageRef?: { _type?: string; asset?: unknown; crop?: unknown; hotspot?: unknown } | null;
  /** Coalesced URL string from `coalesce(heroImage.asset->url, heroImageUrl)`.
   *  Used as a fallback when heroImageRef is absent. */
  heroImage?: string | null;
  /** Hand-supplied external URL (Unsplash, etc.). Lowest priority. */
  heroImageUrl?: string | null;
};

type ImageOpts = {
  /** Output width in pixels. */
  w: number;
  /** Output height in pixels. When provided, fit=crop is used so
   *  Sanity will crop server-side around the editor's hotspot. */
  h?: number;
  /** JPEG/WebP quality 1–100. */
  q?: number;
};

/**
 * Build the URL for an article's hero image at a specific output size.
 *
 * When the raw Sanity image reference is available (`heroImageRef`),
 * we use `@sanity/image-url`'s builder so the Studio-set crop and
 * hotspot are honored AND so Sanity does the server-side crop at the
 * exact width/height we render at — much sharper than letting the
 * browser cover-crop a `fit=max` portrait into a wide hero.
 *
 * Falls back to `sizedImage()` on the URL string when we only have a
 * resolved URL (e.g. articles whose hero is supplied as a heroImageUrl
 * rather than a Sanity asset).
 */
export function urlForArticleImage(
  article: ArticleImageSource | null | undefined,
  opts: ImageOpts
): string {
  if (!article) return "";
  const { w, h, q = 82 } = opts;

  const ref = article.heroImageRef;
  if (ref && ref.asset) {
    let b = builder.image(ref).width(w).quality(q).auto("format");
    if (h) b = b.height(h).fit("crop");
    else b = b.fit("max");
    return b.url() || "";
  }

  // No Sanity reference — fall back to whatever URL we have.
  const url = article.heroImage || article.heroImageUrl || "";
  return sizedImage(url, w, q);
}

/**
 * Build a CDN URL for any raw Sanity image object (not an article —
 * e.g. items from an article's `gallery` array). Same builder path
 * as `urlForArticleImage` so the editor's crop & hotspot are honored
 * and Sanity serves a server-side cropped WebP at the requested
 * width × height.
 *
 * Returns an empty string when the source has no asset reference, so
 * callers can safely `urlForSanityImage(...).length ? ... : null`.
 */
type SanityImageSource = {
  _type?: string;
  asset?: unknown;
  crop?: unknown;
  hotspot?: unknown;
} | null | undefined;

export function urlForSanityImage(
  source: SanityImageSource,
  opts: ImageOpts
): string {
  if (!source || !source.asset) return "";
  const { w, h, q = 82 } = opts;
  let b = builder.image(source).width(w).quality(q).auto("format");
  if (h) b = b.height(h).fit("crop");
  else b = b.fit("max");
  return b.url() || "";
}

export type Hotspot = { x?: number; y?: number; width?: number; height?: number } | null | undefined;

/**
 * Convert a Sanity hotspot ({x, y} in 0..1 image-relative coords) into
 * a CSS `object-position` string. When the hotspot is missing, falls
 * back to centered.
 *
 * Used as a safety net for `<img object-fit:cover>` boxes whose
 * rendered aspect doesn't exactly match the URL's server-side crop —
 * this keeps the editor's chosen subject in frame instead of letting
 * the browser center-crop and lop off heads / plates.
 */
export function objectPositionFromHotspot(hotspot: Hotspot): string {
  const x = typeof hotspot?.x === "number" ? hotspot.x : 0.5;
  const y = typeof hotspot?.y === "number" ? hotspot.y : 0.5;
  return `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`;
}
