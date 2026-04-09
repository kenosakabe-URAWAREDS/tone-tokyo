import { client } from "@/lib/sanity";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticleClient from "./ArticleClient";

const SITE_URL = "https://tone-tokyo.com";
const SITE_NAME = "TONE TOKYO";
const FALLBACK_OG = `${SITE_URL}/og-default.jpg`;

type Article = {
  _id: string;
  title: string;
  titleJa?: string;
  slug: string;
  pillar?: string;
  subtitle?: string;
  heroImage?: string;
  heroCaption?: string;
  body?: unknown;
  locationName?: string;
  locationNameJa?: string;
  tags?: string[];
  readTime?: string;
  publishedAt?: string;
  _updatedAt?: string;
  sourceType?: string;
  area?: string;
  neighborhood?: string;
  address?: string;
  googleMapsUrl?: string;
  officialUrl?: string;
  tabelogUrl?: string;
  priceRange?: string;
  eatGenre?: string;
  eatPriceRange?: string;
  bookingDifficulty?: string;
  editorRating?: number;
};

async function getArticle(slug: string): Promise<Article | null> {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id, title, titleJa, "slug": slug.current, pillar, subtitle,
    "heroImage": coalesce(heroImage.asset->url, heroImageUrl),
    heroCaption, body, locationName, locationNameJa,
    tags, readTime, publishedAt, _updatedAt, sourceType,
    area, neighborhood, address, googleMapsUrl, officialUrl, tabelogUrl, priceRange,
    eatGenre, eatPriceRange, bookingDifficulty, editorRating
  }`;
  return client.fetch(query, { slug });
}

async function getRelatedArticles(pillar: string, currentSlug: string) {
  const query = `*[_type == "article" && pillar == $pillar && slug.current != $currentSlug] | order(publishedAt desc) [0..2] {
    _id, title, "slug": slug.current, pillar,
    "heroImage": coalesce(heroImage.asset->url, heroImageUrl),
    readTime
  }`;
  return client.fetch(query, { pillar, currentSlug });
}

// Extract a plain-text excerpt from a Sanity Portable Text body OR a plain string.
function bodyToText(body: unknown, max = 600): string {
  if (!body) return "";
  if (typeof body === "string") return body.slice(0, max);
  if (!Array.isArray(body)) return "";
  const parts: string[] = [];
  for (const block of body as Array<Record<string, unknown>>) {
    if (block?._type !== "block") continue;
    const children = block.children as Array<{ text?: string }> | undefined;
    if (!children) continue;
    parts.push(children.map((c) => c?.text || "").join(""));
    if (parts.join(" ").length > max) break;
  }
  return parts.join(" ").trim().slice(0, max);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: "Article not found" };
  }

  const url = `${SITE_URL}/article/${article.slug}`;
  const ogTitle = article.title;
  const ogDescription =
    article.subtitle?.trim() ||
    bodyToText(article.body, 200) ||
    `${SITE_NAME} — first-person dispatches from Japan.`;
  const image = article.heroImage || FALLBACK_OG;

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: { canonical: url },
    keywords: [
      ...(article.tags || []),
      article.pillar,
      article.area,
      article.neighborhood,
      article.locationName,
    ].filter(Boolean) as string[],
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      locale: "en_US",
      publishedTime: article.publishedAt,
      modifiedTime: article._updatedAt || article.publishedAt,
      section: article.pillar,
      tags: article.tags,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.heroCaption || article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [image],
    },
  };
}

function buildArticleJsonLd(article: Article) {
  const url = `${SITE_URL}/article/${article.slug}`;
  const description =
    article.subtitle?.trim() || bodyToText(article.body, 300) || undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    alternativeHeadline: article.titleJa,
    description,
    image: article.heroImage ? [article.heroImage] : undefined,
    datePublished: article.publishedAt,
    dateModified: article._updatedAt || article.publishedAt,
    inLanguage: "en",
    articleSection: article.pillar,
    keywords: article.tags?.join(", "),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isAccessibleForFree: true,
  };
}

function buildLocalBusinessJsonLd(article: Article) {
  if (!article.locationName) return null;

  // Pick a more specific Schema.org type when we know the pillar/genre.
  let type: string = "LocalBusiness";
  if (article.pillar === "EAT") {
    const genre = (article.eatGenre || "").toLowerCase();
    if (genre.includes("cafe")) type = "CafeOrCoffeeShop";
    else if (genre.includes("bar")) type = "BarOrPub";
    else if (genre.includes("bakery")) type = "Bakery";
    else type = "Restaurant";
  } else if (article.pillar === "CULTURE") {
    type = "TouristAttraction";
  } else if (article.pillar === "EXPERIENCE") {
    type = "TouristAttraction";
  } else if (article.pillar === "FASHION" || article.pillar === "CRAFT") {
    type = "Store";
  }

  const sameAs = [article.officialUrl, article.tabelogUrl, article.googleMapsUrl].filter(
    Boolean
  ) as string[];

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: article.locationName,
    alternateName: article.locationNameJa,
    url: article.officialUrl || `${SITE_URL}/article/${article.slug}`,
    image: article.heroImage,
    description: article.subtitle || undefined,
  };

  if (article.address || article.area || article.neighborhood) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: article.address,
      addressLocality: article.neighborhood || article.area,
      addressRegion: article.area,
      addressCountry: "JP",
    };
  }

  if (type === "Restaurant" && article.eatGenre) {
    data.servesCuisine = article.eatGenre;
  }

  if (article.eatPriceRange || article.priceRange) {
    data.priceRange = article.eatPriceRange || article.priceRange;
  }

  if (article.editorRating) {
    const ratingMap: Record<number, string> = {
      1: "Worth a visit",
      2: "Highly recommended",
      3: "Must go",
    };
    data.review = {
      "@type": "Review",
      author: { "@type": "Organization", name: SITE_NAME },
      reviewRating: {
        "@type": "Rating",
        ratingValue: article.editorRating,
        bestRating: 3,
        worstRating: 1,
      },
      name: ratingMap[article.editorRating],
    };
  }

  if (sameAs.length) data.sameAs = sameAs;

  return data;
}

function buildFaqJsonLd(article: Article) {
  const faqs: Array<{ q: string; a: string }> = [];

  if (article.locationName) {
    if (article.address || article.neighborhood || article.area) {
      const where = [article.address, article.neighborhood, article.area]
        .filter(Boolean)
        .join(", ");
      faqs.push({
        q: `Where is ${article.locationName} located?`,
        a: `${article.locationName} is in ${where}.`,
      });
    }
    if (article.subtitle) {
      faqs.push({
        q: `What is ${article.locationName}?`,
        a: article.subtitle,
      });
    }
    if (article.eatPriceRange || article.priceRange) {
      faqs.push({
        q: `What's the price range at ${article.locationName}?`,
        a: `Expect around ${article.eatPriceRange || article.priceRange}.`,
      });
    }
    if (article.bookingDifficulty) {
      faqs.push({
        q: `How hard is it to book ${article.locationName}?`,
        a: article.bookingDifficulty,
      });
    }
    if (article.eatGenre) {
      faqs.push({
        q: `What kind of food does ${article.locationName} serve?`,
        a: article.eatGenre,
      });
    }
  }

  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const related = await getRelatedArticles(article.pillar || "", slug);

  const articleJsonLd = buildArticleJsonLd(article);
  const localBusinessJsonLd = buildLocalBusinessJsonLd(article);
  const faqJsonLd = buildFaqJsonLd(article);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {localBusinessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      )}
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ArticleClient article={article} related={related || []} />
    </>
  );
}
