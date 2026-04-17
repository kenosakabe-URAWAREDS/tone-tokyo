import Link from "next/link";

// Palette/font tokens mirrored from the per-page style constants
// (see CLAUDE.md — no shared theme extracted yet). Keep in sync if
// those files change.
const CHARCOAL = "#2D2D2D";
const WARM_GRAY = "#A39E93";
const LIGHT_WARM = "#E8E4DB";
const OFF_WHITE = "#F8F6F1";
const F_SERIF = "'Playfair Display', Georgia, serif";
const F_SANS = "'DM Sans', 'Helvetica Neue', sans-serif";

export default function Footer() {
  return (
    <footer
      style={{
        background: OFF_WHITE,
        borderTop: `1px solid ${LIGHT_WARM}`,
        padding: "40px 24px 32px",
        marginTop: 60,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Left block — logo, operator, contact */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: F_SERIF, fontSize: 18, fontWeight: 700, color: CHARCOAL }}>
              TONE
            </span>
            <span
              style={{
                fontFamily: F_SANS,
                fontSize: 8,
                fontWeight: 500,
                letterSpacing: "0.25em",
                color: WARM_GRAY,
                textTransform: "uppercase" as const,
              }}
            >
              TOKYO
            </span>
          </div>
          <p
            style={{
              fontFamily: F_SANS,
              fontSize: 11,
              color: WARM_GRAY,
              marginTop: 12,
              lineHeight: 1.6,
            }}
          >
            Operated by KAKEHASHI Inc.
            <br />
            An independent guide to Japan — written from the inside.
          </p>
          <p style={{ fontFamily: F_SANS, fontSize: 11, color: WARM_GRAY, marginTop: 12 }}>
            <a
              href="mailto:contact@tone-tokyo.com"
              style={{
                color: WARM_GRAY,
                textDecoration: "none",
                borderBottom: `1px solid ${LIGHT_WARM}`,
              }}
            >
              contact@tone-tokyo.com
            </a>
          </p>
        </div>

        {/* Right block — nav */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-end",
            fontFamily: F_SANS,
            fontSize: 11,
          }}
        >
          <Link href="/about" style={{ color: CHARCOAL, textDecoration: "none" }}>
            About
          </Link>
          <Link href="/discover" style={{ color: CHARCOAL, textDecoration: "none" }}>
            Discover
          </Link>
          <Link href="/privacy" style={{ color: CHARCOAL, textDecoration: "none" }}>
            Privacy Policy
          </Link>
        </nav>
      </div>

      {/* Bottom bar — copyright + location */}
      <div
        style={{
          maxWidth: 1200,
          margin: "32px auto 0",
          paddingTop: 20,
          borderTop: `1px solid ${LIGHT_WARM}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: F_SANS,
          fontSize: 10,
          color: WARM_GRAY,
        }}
      >
        <span>{"\u00A9"} 2026 KAKEHASHI Inc. All rights reserved.</span>
        <span>Tokyo, Japan</span>
      </div>
    </footer>
  );
}
