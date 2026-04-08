"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const C = {
  indigo: "#1B3A5C", charcoal: "#2D2D2D", warmGray: "#A39E93",
  offWhite: "#F8F6F1", cream: "#F0EDE6", lightWarm: "#E8E4DB",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Source Serif 4', Georgia, serif",
  ui: "'DM Sans', 'Helvetica Neue', sans-serif",
  jp: "'Noto Sans JP', sans-serif",
};

/* ── Portable Text → Custom blocks converter ── */
function sanityBodyToBlocks(body: any): any[] {
  if (!body) return [];
  // If body is already our custom block format (array of {type, text, ...})
  if (Array.isArray(body) && body.length > 0 && body[0].type && typeof body[0].type === "string" &&
      ["paragraph","heading","lead","image","pullquote","info_box"].includes(body[0].type)) {
    return body;
  }
  // If body is Sanity Portable Text (array of {_type: "block", ...})
  if (Array.isArray(body)) {
    return body.map((block: any) => {
      if (block._type === "block") {
        const text = (block.children || []).map((c: any) => c.text || "").join("");
        if (block.style === "h2" || block.style === "h3") {
          return { type: "heading", text };
        }
        return { type: "paragraph", text };
      }
      if (block._type === "image" && block.asset) {
        return { type: "image", src: block.asset.url || "", alt: block.alt || "", caption: block.caption || "" };
      }
      return { type: "paragraph", text: "" };
    }).filter((b: any) => b.text || b.src);
  }
  return [];
}

/* ── Reading Progress Bar ── */
function ProgressBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 3, zIndex: 100, background: "transparent" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: C.indigo, transition: "width 80ms linear" }} />
    </div>
  );
}

/* ── Sticky Header ── */
function StickyHeader({ visible, title }: { visible: boolean; title: string }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", zIndex: 90,
      background: "rgba(248,246,241,0.95)", backdropFilter: "blur(10px)",
      borderBottom: `1px solid ${C.lightWarm}`,
      transform: visible ? "translateY(0)" : "translateY(-100%)",
      transition: "transform 0.3s ease",
      padding: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: C.charcoal, letterSpacing: "0.08em" }}>TONE <span style={{ fontWeight: 400, fontSize: 11, letterSpacing: "0.14em", color: C.warmGray }}>TOKYO</span></span>
      </Link>
      <span style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray, fontStyle: "italic", maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
    </div>
  );
}

/* ── Pull Quote ── */
function PullQuote({ text, attribution }: { text: string; attribution?: string }) {
  return (
    <blockquote style={{ margin: "44px 0", padding: "28px 0 28px 28px", borderLeft: `3px solid ${C.indigo}` }}>
      <p style={{ fontFamily: F.display, fontSize: "clamp(20px, 2.5vw, 24px)", fontStyle: "italic", lineHeight: 1.5, color: C.charcoal }}>{text}</p>
      {attribution && <cite style={{ fontFamily: F.ui, fontSize: 13, color: C.warmGray, fontStyle: "normal", display: "block", marginTop: 12 }}>&mdash; {attribution}</cite>}
    </blockquote>
  );
}

/* ── Info Box ── */
function InfoBox({ title, items }: { title: string; items: any[] }) {
  return (
    <div style={{ margin: "36px 0", padding: 28, background: C.cream, borderRadius: 4 }}>
      <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 16 }}>{title}</div>
      {(items || []).map((item: any, i: number) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, fontFamily: F.body, fontSize: 15, lineHeight: 1.6, color: C.charcoal }}>
          <span style={{ fontWeight: 600, minWidth: 90 }}>{item.label}:</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Article Image ── */
function ArticleImage({ src, caption, alt }: { src: string; caption?: string; alt: string }) {
  return (
    <figure style={{ margin: "36px -60px", maxWidth: "calc(100% + 120px)" }}>
      <img src={src} alt={alt} style={{ width: "100%", borderRadius: 2, display: "block" }} />
      {caption && <figcaption style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, fontStyle: "italic", marginTop: 10, paddingLeft: 60 }}>{caption}</figcaption>}
    </figure>
  );
}

/* ── Body Block Renderer ── */
function Block({ block, i }: { block: any; i: number }) {
  switch (block.type) {
    case "lead":
      return (
        <p key={i} style={{ fontFamily: F.body, fontSize: "clamp(18px, 2vw, 20px)", lineHeight: 1.85, color: C.charcoal, marginBottom: 28 }}>
          <span style={{ fontFamily: F.display, fontSize: "clamp(44px, 5vw, 56px)", float: "left", lineHeight: 0.82, marginRight: 10, marginTop: 6, color: C.indigo, fontWeight: 700 }}>
            {block.text[0]}
          </span>
          {block.text.slice(1)}
        </p>
      );
    case "paragraph":
      return <p key={i} style={{ fontFamily: F.body, fontSize: "clamp(16px, 1.8vw, 18px)", lineHeight: 1.8, color: C.charcoal, marginBottom: 24 }}>{block.text}</p>;
    case "heading":
      return <h2 key={i} style={{ fontFamily: F.display, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: C.charcoal, margin: "44px 0 18px", lineHeight: 1.3 }}>{block.text}</h2>;
    case "image":
      return <ArticleImage key={i} src={block.src} caption={block.caption} alt={block.alt || block.caption || ""} />;
    case "pullquote":
      return <PullQuote key={i} text={block.text} attribution={block.attribution} />;
    case "info_box":
      return <InfoBox key={i} title={block.title} items={block.items} />;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════
   MAIN ARTICLE CLIENT
   ═══════════════════════════════════════════ */
export default function ArticleClient({ article, related }: { article: any; related: any[] }) {
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const heroImage = article.heroImage || article.heroImageUrl || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1400&q=85";
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";
  const blocks = sanityBodyToBlocks(article.body);

  useEffect(() => {
    const fn = () => {
      if (heroRef.current) setStickyVisible(heroRef.current.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <ProgressBar />
      <StickyHeader visible={stickyVisible} title={article.title} />

      <div style={{ background: C.offWhite, minHeight: "100vh" }}>

        {/* ── HERO ── */}
        <div ref={heroRef}>
          <nav style={{
            position: "absolute", top: 0, left: 0, width: "100%", zIndex: 10,
            padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <div>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 22, color: "#fff", letterSpacing: "0.08em", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}>TONE <span style={{ fontWeight: 400, fontSize: 13, letterSpacing: "0.14em" }}>TOKYO</span></span>
                <div style={{ fontFamily: F.jp, fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3em", marginTop: 2 }}>音 東京</div>
              </div>
            </Link>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <button style={{
                padding: "8px 18px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: 2, color: "#fff",
                fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer",
              }}>SUBSCRIBE</button>
            </div>
          </nav>

          {/* Hero Image */}
          <div style={{ position: "relative", width: "100%", height: "70vh", minHeight: 420, maxHeight: 700, overflow: "hidden" }}>
            <img src={heroImage} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "linear-gradient(transparent, rgba(0,0,0,0.55))", height: "50%" }} />
            {article.heroCaption && (
              <div style={{ position: "absolute", bottom: 16, right: 24, fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>{article.heroCaption}</div>
            )}
          </div>
        </div>

        {/* ── ARTICLE CONTAINER ── */}
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>

          {/* Article Header */}
          <div style={{ padding: "40px 0 32px", borderBottom: `1px solid ${C.lightWarm}`, marginBottom: 36 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 16 }}>{article.pillar}</div>
            <h1 style={{ fontFamily: F.display, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, lineHeight: 1.15, color: C.charcoal, marginBottom: 18 }}>{article.title}</h1>
            <p style={{ fontFamily: F.body, fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.6, color: C.warmGray, fontStyle: "italic" }}>{article.subtitle}</p>

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600 }}>K</span>
                </div>
                <div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.charcoal }}>The Editor</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{dateStr}{article.readTime ? ` · ${article.readTime}` : ""}</div>
                </div>
              </div>
              {(article.locationName) && (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <span>📍</span> {article.locationName}{article.locationNameJa ? ` (${article.locationNameJa})` : ""}
                  {article.officialUrl && <a href={article.officialUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.indigo, marginLeft: 8, fontSize: 11, textDecoration: "underline" }}>Official Site</a>}
                  {article.googleMapsUrl && <a href={article.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.indigo, marginLeft: 8, fontSize: 11, textDecoration: "underline" }}>Google Maps</a>}
                </div>
              )}
            </div>
          </div>

          {/* ── BODY ── */}
          <article>{blocks.map((block: any, i: number) => <Block key={i} block={block} i={i} />)}</article>

          {/* ── TAGS ── */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "48px 0 32px", paddingTop: 32, borderTop: `1px solid ${C.lightWarm}` }}>
              {article.tags.map((tag: string, i: number) => (
                <span key={i} style={{ fontFamily: F.ui, fontSize: 12, padding: "5px 14px", background: C.cream, borderRadius: 2, color: C.warmGray }}>{tag}</span>
              ))}
            </div>
          )}

          {/* ── AUTHOR BIO ── */}
          <div style={{ padding: "32px 0", borderTop: `1px solid ${C.lightWarm}`, display: "flex", gap: 20, alignItems: "flex-start", marginTop: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontFamily: F.ui, fontSize: 22, fontWeight: 600 }}>K</span>
            </div>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>The Editor</div>
              <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.7, color: C.warmGray }}>
                Travels the world, comes home to Tokyo. How things are made, where to find a great meal, and what makes this country worth paying attention to. Someone who knows Japan from the inside—and from the outside looking back in.
              </p>
            </div>
          </div>

          {/* ── RELATED ARTICLES ── */}
          {related.length > 0 && (
            <div style={{ padding: "40px 0", borderTop: `1px solid ${C.lightWarm}` }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 24 }}>Related Articles</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                {related.map((r: any) => (
                  <Link key={r._id} href={`/article/${r.slug}`} style={{ textDecoration: "none" }}>
                    <div>
                      <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                        <img src={r.heroImage || r.heroImageUrl || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=80"} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 4 }}>{r.pillar}</div>
                      <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: C.charcoal }}>{r.title}</div>
                      {r.readTime && <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 6 }}>{r.readTime}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── NEWSLETTER CTA ── */}
          <div style={{ padding: "48px 0", borderTop: `1px solid ${C.lightWarm}`, textAlign: "center" as const }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 10 }}>Stay Connected</div>
            <h3 style={{ fontFamily: F.display, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>This Week in Japan</h3>
            <p style={{ fontFamily: F.body, fontSize: 15, color: C.warmGray, marginBottom: 24, maxWidth: 440, margin: "0 auto 24px" }}>A weekly dispatch from Tokyo—what to eat, what to wear, and what&apos;s worth paying attention to.</p>
            <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
              <input type="email" placeholder="your@email.com" style={{
                flex: 1, minWidth: 200, padding: "12px 16px", border: `1px solid ${C.lightWarm}`, borderRadius: 2,
                fontFamily: F.ui, fontSize: 14, background: "#fff", outline: "none",
              }} />
              <button style={{
                padding: "12px 28px", background: C.indigo, color: "#fff", border: "none", borderRadius: 2,
                fontFamily: F.ui, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em", cursor: "pointer",
              }}>Subscribe</button>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ background: C.charcoal, padding: "40px 28px", textAlign: "center" as const }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "0.08em" }}>TONE <span style={{ fontWeight: 400, fontSize: 11, letterSpacing: "0.14em", color: C.warmGray }}>TOKYO</span></span>
          </Link>
          <p style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 12 }}>Japan, through the eyes of someone who lives it</p>
          <p style={{ fontFamily: F.ui, fontSize: 10, color: "rgba(163,158,147,0.5)", marginTop: 20 }}>&copy; {new Date().getFullYear()} TONE TOKYO. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
