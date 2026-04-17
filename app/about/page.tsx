import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

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

const kickerStyle = {
  fontFamily: F.ui,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: C.indigo,
  marginBottom: 16,
};
const h1Style = {
  fontFamily: F.display,
  fontSize: "clamp(30px, 5vw, 44px)",
  fontWeight: 700,
  lineHeight: 1.18,
  color: C.charcoal,
  margin: "0 0 24px 0",
};
const h2Style = {
  fontFamily: F.display,
  fontSize: "clamp(22px, 3vw, 28px)",
  fontWeight: 700,
  lineHeight: 1.3,
  color: C.charcoal,
  margin: "44px 0 18px 0",
};
const proseStyle = {
  fontFamily: F.body,
  fontSize: "clamp(16px, 1.8vw, 18px)",
  lineHeight: 1.8,
  color: C.charcoal,
};
const pStyle = { margin: "0 0 24px 0" };
const ulStyle = { paddingLeft: 22, margin: "0 0 24px 0" };
const liStyle = { marginBottom: 10 };

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
        <div style={kickerStyle}>About</div>
        <h1 style={h1Style}>About TONE TOKYO</h1>
        <div style={{ width: 60, height: 2, background: C.indigo, marginBottom: 36 }} />

        <div style={proseStyle}>
          <p style={pStyle}>
            TONE TOKYO is an independent guide to Japanese fashion, food, culture, experience, and
            craft — written from the inside.
          </p>
          <p style={pStyle}>
            Every recommendation on this site comes from personal experience. No press trips, no
            sponsored rankings, no algorithmic curation. Just years of living in Tokyo, eating at
            neighborhood counters, visiting factories, and paying attention to what&apos;s actually
            good.
          </p>
        </div>

        <h2 style={h2Style}>Who we are</h2>
        <div style={proseStyle}>
          <p style={pStyle}>
            TONE TOKYO is operated by <strong>KAKEHASHI Inc.</strong>, a Tokyo-based company founded
            to publish first-person dispatches about Japan for an international audience. The
            magazine is edited by The Editor, who has spent years working inside Japan&apos;s
            fashion industry and building relationships with makers, chefs, and creators across the
            country.
          </p>
          <p style={pStyle}>
            This isn&apos;t a travel aggregator. We don&apos;t republish press releases. The
            articles on this site are the places and people The Editor actually visits — the
            restaurants that don&apos;t appear in guidebooks, the brands that don&apos;t need hype,
            and the experiences that make Japan worth paying attention to.
          </p>
        </div>

        <h2 style={h2Style}>What we cover</h2>
        <div style={proseStyle}>
          <p style={pStyle}>TONE TOKYO covers six pillars:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Fashion</strong> — brands, shops, and collections from the people making
              clothes with conviction.
            </li>
            <li style={liStyle}>
              <strong>Eat</strong> — restaurants, cafés, izakaya, and bars, from everyday counters
              to once-in-a-lifetime counters.
            </li>
            <li style={liStyle}>
              <strong>Culture</strong> — music, art, film, design, and the city&apos;s after-hours.
            </li>
            <li style={liStyle}>
              <strong>Experience</strong> — neighborhood walks, day trips, shrines, sentō, and
              seasonal Japan.
            </li>
            <li style={liStyle}>
              <strong>Craft</strong> — the workshops behind what we wear and live with: denim
              mills, ceramic kilns, indigo vats, eyewear benches.
            </li>
            <li style={liStyle}>
              <strong>Family</strong> — traveling in Japan with kids, and navigating daily life as
              a Tokyo parent.
            </li>
          </ul>
        </div>

        <h2 style={h2Style}>Editorial standards</h2>
        <div style={proseStyle}>
          <p style={pStyle}>
            We only write about places and products we have personally experienced. We do not
            accept payment in exchange for coverage. We do not run sponsored posts or native
            advertising.
          </p>
          <p style={pStyle}>
            The Editor is a founder or co-founder of <strong>KURO</strong>,{" "}
            <strong>VONN</strong>, <strong>THE BLUE STORE</strong>,{" "}
            <strong>AIZOME REWEAR</strong>, <strong>LYNARC</strong>, <strong>PRAS</strong>,{" "}
            <strong>INDIO &amp; SELVEDGE</strong>, and <strong>THE UNION</strong>.
          </p>
          <p style={pStyle}>
            Additionally, Blues Inc. (KAKEHASHI Inc.&apos;s sister company) is the Japanese
            distributor of <strong>Rylee+Cru</strong>, <strong>Quincy Mae</strong>, and{" "}
            <strong>Noralee</strong>.
          </p>
          <p style={pStyle}>
            Articles that cover any of these brands carry a disclosure at the end of the piece so
            readers can see the exact relationship for themselves. Editorial decisions on those
            articles — what we cover, how we cover it, and what we leave out — remain independent.
          </p>
          <p style={pStyle}>
            When AI is used in our production process, it supports the editorial work rather than
            replacing it. Every article is grounded in The Editor&apos;s first-hand experience,
            with AI helping to structure and sharpen the writing — never to invent facts or
            generate dispatches from scratch.
          </p>
        </div>

        <h2 style={h2Style}>Stay in touch</h2>
        <div style={proseStyle}>
          <p style={pStyle}>
            New articles are published regularly. Subscribe to the weekly newsletter for a curated
            dispatch every Friday.
          </p>
          <p style={pStyle}>
            For press inquiries, collaborations, or editorial questions:{" "}
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

      <Footer />
    </div>
  );
}
