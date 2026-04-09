import type { Metadata } from "next";
import Link from "next/link";

// Design tokens kept in sync with app/article/[slug]/ArticleClient.tsx
// (the project hasn't extracted a shared theme — see CLAUDE.md note).
const C = {
  indigo: "#1B3A5C",
  charcoal: "#2D2D2D",
  warmGray: "#A39E93",
  offWhite: "#F8F6F1",
  cream: "#F0EDE6",
  lightWarm: "#E8E4DB",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Serif 4', Georgia, serif",
  ui: "'DM Sans', 'Helvetica Neue', sans-serif",
  jp: "'Noto Sans JP', sans-serif",
};

const PILLARS_LIST: Array<{ name: string; desc: string }> = [
  { name: "Fashion", desc: "Japanese brands, stores, and the people behind them" },
  { name: "Eat", desc: "Restaurants, izakayas, and food culture from someone who eats out every day" },
  { name: "Culture", desc: "Music, art, nightlife, and the creative scene" },
  { name: "Experience", desc: "Travel, neighborhoods, and seasonal moments" },
  { name: "Craft", desc: "Factories, artisans, and how things are made" },
  { name: "Family", desc: "Kid-friendly restaurants, activities, and day trips" },
];

export const metadata: Metadata = {
  title: "About",
  description:
    "TONE TOKYO is an independent guide to Japanese fashion, food, culture, and craft — written from the inside. Every recommendation comes from personal experience.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — TONE TOKYO",
    description:
      "An independent guide to Japanese fashion, food, culture, and craft — written from the inside.",
    type: "website",
    url: "/about",
  },
  twitter: {
    card: "summary",
    title: "About — TONE TOKYO",
    description:
      "An independent guide to Japanese fashion, food, culture, and craft — written from the inside.",
  },
};

export default function AboutPage() {
  return (
    <div style={{ background: C.offWhite, minHeight: "100vh" }}>
      {/* Top nav — simple bar that links back home. Not absolute over a
          hero (no hero on this page), so the logo sits in charcoal
          rather than the white-over-image variant ArticleClient uses. */}
      <nav
        style={{
          borderBottom: `1px solid ${C.lightWarm}`,
          padding: "20px 24px",
          background: C.offWhite,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span
                style={{
                  fontFamily: F.display,
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.charcoal,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                TONE
              </span>
              <span
                style={{
                  fontFamily: F.ui,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.25em",
                  color: C.warmGray,
                  textTransform: "uppercase" as const,
                  lineHeight: 1,
                }}
              >
                TOKYO
              </span>
            </div>
            <div
              style={{
                fontFamily: F.jp,
                fontSize: 6,
                fontWeight: 300,
                letterSpacing: "0.45em",
                color: C.warmGray,
                marginTop: 3,
                lineHeight: 1,
              }}
            >
              {"\u97F3 \u6771\u4EAC"}
            </div>
          </Link>
        </div>
      </nav>

      {/* Main content — same 720px column ArticleClient uses */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 40px" }}>
        <div
          style={{
            fontFamily: F.ui,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase" as const,
            color: C.indigo,
            marginBottom: 16,
          }}
        >
          About
        </div>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: "clamp(30px, 5vw, 44px)",
            fontWeight: 700,
            lineHeight: 1.18,
            color: C.charcoal,
            margin: "0 0 24px 0",
          }}
        >
          About TONE TOKYO
        </h1>
        <div style={{ width: 60, height: 2, background: C.indigo, marginBottom: 36 }} />

        {/* Intro paragraphs — matches ArticleClient body styles */}
        <div
          style={{
            fontFamily: F.body,
            fontSize: "clamp(16px, 1.8vw, 18px)",
            lineHeight: 1.8,
            color: C.charcoal,
          }}
        >
          <p style={{ margin: "0 0 24px 0" }}>
            TONE TOKYO is an independent guide to Japanese fashion, food, culture, and craft — written from the inside.
          </p>
          <p style={{ margin: "0 0 24px 0" }}>
            Every recommendation on this site comes from personal experience. No press trips, no sponsored rankings, no algorithmic curation. Just years of living in Tokyo, eating at neighborhood counters, visiting factories, and paying attention to what&apos;s actually good.
          </p>
          <p style={{ margin: "0 0 24px 0" }}>
            The Editor behind TONE TOKYO works in Japan&apos;s fashion industry and has spent years building relationships with makers, chefs, and creators across the country. This site exists to share that access with an international audience — the restaurants that don&apos;t appear in guidebooks, the brands that don&apos;t need hype, and the experiences that make Japan worth paying attention to.
          </p>
        </div>

        {/* Six pillars section */}
        <h2
          style={{
            fontFamily: F.display,
            fontSize: "clamp(22px, 3vw, 28px)",
            fontWeight: 700,
            color: C.charcoal,
            margin: "44px 0 18px 0",
            lineHeight: 1.3,
          }}
        >
          The Six Pillars
        </h2>
        <p
          style={{
            fontFamily: F.body,
            fontSize: "clamp(16px, 1.8vw, 18px)",
            lineHeight: 1.8,
            color: C.charcoal,
            margin: "0 0 12px 0",
          }}
        >
          TONE TOKYO covers six pillars:
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px 0" }}>
          {PILLARS_LIST.map((p) => (
            <li
              key={p.name}
              style={{
                padding: "16px 0",
                borderBottom: `1px solid ${C.lightWarm}`,
                display: "flex",
                gap: 18,
                alignItems: "baseline",
                flexWrap: "wrap" as const,
              }}
            >
              <span
                style={{
                  fontFamily: F.ui,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: C.indigo,
                  minWidth: 96,
                  flexShrink: 0,
                }}
              >
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: F.body,
                  fontSize: "clamp(14px, 1.6vw, 16px)",
                  color: C.charcoal,
                  lineHeight: 1.55,
                  flex: 1,
                  minWidth: 200,
                }}
              >
                {p.desc}
              </span>
            </li>
          ))}
        </ul>

        {/* Closing — newsletter + contact */}
        <div
          style={{
            fontFamily: F.body,
            fontSize: "clamp(16px, 1.8vw, 18px)",
            lineHeight: 1.8,
            color: C.charcoal,
          }}
        >
          <p style={{ margin: "0 0 24px 0" }}>
            New articles are published regularly. Subscribe to the weekly newsletter for a curated dispatch every Friday.
          </p>
          <p style={{ margin: "0 0 24px 0" }}>
            For press inquiries or collaborations:{" "}
            <a
              href="mailto:contact@tone-tokyo.com"
              style={{
                color: C.indigo,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              contact@tone-tokyo.com
            </a>
          </p>
        </div>
      </main>

      {/* Footer — mirrors the bottom block on the article page */}
      <footer
        style={{
          borderTop: `1px solid ${C.lightWarm}`,
          padding: "32px 24px 60px",
          textAlign: "center" as const,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
            <span
              style={{
                fontFamily: F.display,
                fontSize: 20,
                fontWeight: 700,
                color: C.charcoal,
              }}
            >
              TONE
            </span>
            <span
              style={{
                fontFamily: F.ui,
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: "0.25em",
                color: C.warmGray,
                textTransform: "uppercase" as const,
              }}
            >
              TOKYO
            </span>
          </div>
          <div
            style={{
              fontFamily: F.jp,
              fontSize: 6,
              fontWeight: 300,
              letterSpacing: "0.45em",
              color: C.warmGray,
              marginTop: 4,
            }}
          >
            {"\u97F3 \u6771\u4EAC"}
          </div>
        </Link>
        <p style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 16 }}>
          Japan, through the eyes of someone who lives it.
        </p>
        <p style={{ fontFamily: F.ui, fontSize: 10, color: C.lightWarm, marginTop: 8 }}>
          {"\u00A9"} 2026 TONE TOKYO
        </p>
      </footer>
    </div>
  );
}
