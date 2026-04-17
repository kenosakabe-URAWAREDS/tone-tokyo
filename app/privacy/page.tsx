import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

// Per-page palette/fonts — see CLAUDE.md; no shared theme yet.
const C = {
  indigo: "#1B3A5C",
  charcoal: "#2D2D2D",
  warmGray: "#A39E93",
  offWhite: "#F8F6F1",
  lightWarm: "#E8E4DB",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Serif 4', Georgia, serif",
  ui: "'DM Sans', 'Helvetica Neue', sans-serif",
};

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TONE TOKYO (operated by KAKEHASHI Inc.) collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

// Update this ISO date when the policy text changes.
const LAST_UPDATED = "2026-04-17";

const sectionStyle = { marginBottom: 40 };
const h2Style = {
  fontFamily: F.display,
  fontSize: 22,
  fontWeight: 700,
  color: C.charcoal,
  marginBottom: 14,
  marginTop: 0,
};
const pStyle = {
  fontFamily: F.body,
  fontSize: 16,
  lineHeight: 1.75,
  color: C.charcoal,
  marginBottom: 14,
};
const ulStyle = { paddingLeft: 24, margin: "0 0 14px 0" };
const liStyle = {
  fontFamily: F.body,
  fontSize: 16,
  lineHeight: 1.75,
  color: C.charcoal,
  marginBottom: 10,
};
const linkStyle = { color: C.indigo, textDecoration: "underline" };

export default function PrivacyPage() {
  return (
    <div style={{ background: C.offWhite, minHeight: "100vh" }}>
      {/* Minimal top nav — mirrors /about */}
      <nav
        style={{
          borderBottom: `1px solid ${C.lightWarm}`,
          padding: "20px 24px",
          background: C.offWhite,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "baseline",
              gap: 5,
            }}
          >
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
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 36,
            fontWeight: 700,
            color: C.charcoal,
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontFamily: F.ui,
            fontSize: 12,
            color: C.warmGray,
            marginBottom: 48,
            marginTop: 0,
          }}
        >
          Last updated: {LAST_UPDATED}
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Who we are</h2>
          <p style={pStyle}>
            TONE TOKYO (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an independent editorial publication operated by{" "}
            <strong>KAKEHASHI Inc.</strong> (&quot;KAKEHASHI&quot;), a company registered in Japan. This policy
            explains what personal information we collect through{" "}
            <a href="https://tone-tokyo.com" style={linkStyle}>
              tone-tokyo.com
            </a>
            , how we use it, and the choices you have.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Information we collect</h2>
          <p style={pStyle}>
            We keep the information we collect to the minimum needed to operate the site:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Newsletter signup:</strong> your email address, submitted via the form on this
              site.
            </li>
            <li style={liStyle}>
              <strong>Analytics:</strong> anonymized usage data such as pages visited, approximate
              region, device type, and referrer — collected via Google Analytics 4 (see §5 below).
            </li>
            <li style={liStyle}>
              <strong>Contact correspondence:</strong> the contents of any email you send to{" "}
              <a href="mailto:contact@tone-tokyo.com" style={linkStyle}>
                contact@tone-tokyo.com
              </a>
              .
            </li>
          </ul>
          <p style={pStyle}>
            We do <strong>not</strong> collect names, addresses, phone numbers, payment information,
            or any special category data (such as health or political information).
          </p>
          <p style={pStyle}>
            <strong>How long we keep it:</strong>
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Newsletter subscribers:</strong> until you unsubscribe. You can unsubscribe at
              any time via the link in every newsletter email, or by writing to{" "}
              <a href="mailto:contact@tone-tokyo.com" style={linkStyle}>
                contact@tone-tokyo.com
              </a>
              .
            </li>
            <li style={liStyle}>
              <strong>Google Analytics 4 data:</strong> 26 months (the GA4 default retention period).
            </li>
            <li style={liStyle}>
              <strong>Contact form submissions:</strong> 3 years, then deleted — unless an ongoing
              correspondence requires longer retention.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. How we use your information</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Newsletter emails:</strong> we use your email address only to send you the
              TONE TOKYO newsletter and related updates.
            </li>
            <li style={liStyle}>
              <strong>Site improvement:</strong> we use aggregated analytics to understand which
              articles resonate with readers and to improve editorial direction.
            </li>
            <li style={liStyle}>
              <strong>Correspondence:</strong> we use contact emails solely to reply to you.
            </li>
          </ul>
          <p style={pStyle}>
            We do not sell, rent, or share your personal information with third parties for their
            marketing purposes. Ever.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Third-party services we use</h2>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Supabase, Inc.</strong> — stores newsletter subscriber email addresses. Data
              is held on Supabase&apos;s infrastructure in the United States.
            </li>
            <li style={liStyle}>
              <strong>Google Analytics 4 (Google LLC)</strong> — provides anonymized traffic
              statistics. GA4 may transfer data to Google servers outside the EU, including in the
              United States.
            </li>
            <li style={liStyle}>
              <strong>Vercel Inc.</strong> — hosts the website. Server logs may be processed in
              multiple regions.
            </li>
            <li style={liStyle}>
              <strong>Sanity.io (Sanity AS)</strong> — stores the editorial content of the site. No
              reader data is stored in Sanity.
            </li>
          </ul>
          <p style={pStyle}>
            Each of these providers has its own privacy practices, which we encourage you to
            review.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Cookies and tracking</h2>
          <p style={pStyle}>
            We use a small number of cookies, mostly set by Google Analytics 4, to understand site
            traffic. These cookies do not identify you personally. We do not use advertising
            cookies or cross-site tracking pixels.
          </p>
          <p style={pStyle}>
            You can disable cookies via your browser settings at any time. For EU/EEA/UK visitors,
            we are rolling out a cookie consent banner in Phase 1 that will offer two choices on
            your first visit:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Accept all:</strong> enables Google Analytics 4 so we can understand which
              articles resonate with readers.
            </li>
            <li style={liStyle}>
              <strong>Essential only:</strong> disables Google Analytics 4 on your device. The site
              will work exactly the same for you; we simply will not record your visit in analytics.
            </li>
          </ul>
          <p style={pStyle}>
            Your choice is remembered in your browser&apos;s local storage so the banner does not
            reappear. You can change your choice at any time by clearing site data in your browser
            or by emailing{" "}
            <a href="mailto:contact@tone-tokyo.com" style={linkStyle}>
              contact@tone-tokyo.com
            </a>
            .
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. International data transfers</h2>
          <p style={pStyle}>
            Because Supabase and Google Analytics operate from the United States, your information
            may be transferred to, stored in, and processed in countries outside Japan or the
            European Economic Area. We rely on these providers&apos; own safeguards (standard
            contractual clauses and equivalent mechanisms) to ensure your data receives adequate
            protection.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Your rights</h2>
          <p style={pStyle}>
            Under applicable data protection laws (including Japan&apos;s APPI, the EU GDPR, and the
            UK GDPR), you have the right to:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>
              <strong>Access</strong> the personal information we hold about you.
            </li>
            <li style={liStyle}>
              <strong>Correct</strong> information that is inaccurate or incomplete.
            </li>
            <li style={liStyle}>
              <strong>Delete</strong> your information (&quot;right to be forgotten&quot;).
            </li>
            <li style={liStyle}>
              <strong>Stop</strong> our processing of your information at any time (including
              unsubscribing from the newsletter).
            </li>
            <li style={liStyle}>
              <strong>Object</strong> to analytics collection, where applicable under local law.
            </li>
            <li style={liStyle}>
              <strong>Portability:</strong> request a copy of your data in a portable format.
            </li>
          </ul>
          <p style={pStyle}>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:contact@tone-tokyo.com" style={linkStyle}>
              contact@tone-tokyo.com
            </a>
            . We will respond within 30 days. You also have the right to lodge a complaint with
            your local data protection authority.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Contact</h2>
          <p style={pStyle}>
            Questions about this policy, or about how we handle your information?
          </p>
          <p style={pStyle}>
            <strong>KAKEHASHI Inc.</strong>
            <br />
            Tokyo, Japan
            <br />
            Email:{" "}
            <a href="mailto:contact@tone-tokyo.com" style={linkStyle}>
              contact@tone-tokyo.com
            </a>
          </p>
          {/* Registered address intentionally omitted in Phase 1; to be
              updated once confirmed. */}
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Changes to this policy</h2>
          <p style={pStyle}>
            We may update this policy from time to time. Significant changes will be announced via
            the newsletter and via an updated &quot;Last updated&quot; date at the top of this
            page.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
