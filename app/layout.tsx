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
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    google: "ZaeooWIXdFmvR-L_GUF65QOHS4IQ7npzKNd6g80oFBQ",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "TONE TOKYO Magazine",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/discover?pillar={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  foundingLocation: {
    "@type": "Place",
    name: "Tokyo, Japan",
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
