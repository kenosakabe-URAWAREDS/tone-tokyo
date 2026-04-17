import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://tone-tokyo.com";
const SITE_NAME = "TONE TOKYO";
const SITE_TITLE = "TONE TOKYO — Japan, Through the Eyes of Someone Who Lives It";
const SITE_DESCRIPTION =
  "An insider's guide to Japanese fashion, food, culture, experience, and craft. First-person dispatches from Tokyo and beyond.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — TONE TOKYO",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Tokyo",
    "Japan",
    "Japanese fashion",
    "Japanese food",
    "Japanese culture",
    "Japanese craft",
    "Tokyo guide",
    "Japan travel",
  ],
  authors: [{ name: "TONE TOKYO" }],
  creator: "TONE TOKYO",
  publisher: "TONE TOKYO",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? "ZaeooWIXdFmvR-L_GUF65QOHS4IQ7npzKNd6g80oFBQ",
  },
};

// Linked via @id so the WebSite node's publisher can reference this
// Organization without duplicating the publisher payload.
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: "TONE TOKYO Magazine",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION_ID },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/discover?pillar={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// TONE TOKYO is the publication; KAKEHASHI Inc. is the operating
// legal entity. `legalName` makes that relationship explicit to
// search engines without requiring a second sibling Organization.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  legalName: "KAKEHASHI Inc.",
  alternateName: "TONE TOKYO Magazine",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  foundingLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tokyo",
      addressCountry: "JP",
    },
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "editorial",
    email: "contact@tone-tokyo.com",
    availableLanguage: ["en", "ja"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=DM+Sans:wght@400;500;600&family=Noto+Sans+JP:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="alternate" type="application/rss+xml" title="TONE TOKYO" href="/sitemap.xml" />
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
