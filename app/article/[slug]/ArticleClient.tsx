"use client";
import { useState, useEffect, useRef } from "react";
import { PortableText } from "@portabletext/react";
import Link from "next/link";
import { sizedImage, urlForArticleImage } from "@/lib/image";

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
const FALLBACK = "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=80";

function pillarColor(p?: string) {
  const m: Record<string, string> = { FASHION: "#1B3A5C", EAT: "#8B4513", CULTURE: "#6B2D5B", EXPERIENCE: "#2D5B3A", CRAFT: "#5B4B2D", FAMILY: "#C67050" };
  return m[p?.toUpperCase() || ""] || C.indigo;
}
function fmtDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ProgressBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => { const el = document.getElementById("article-body"); if (!el) return; const r = el.getBoundingClientRect(); setP(Math.min(100, (Math.max(0, -r.top) / (el.scrollHeight - window.innerHeight * 0.5)) * 100)); };
    window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn);
  }, []);
  return (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 3, zIndex: 100 }}><div style={{ height: "100%", width: p + "%", background: C.indigo, transition: "width 0.1s linear" }} /></div>);
}

function StickyHeader({ visible, pillar, readTime }: { visible: boolean; pillar?: string; readTime?: string }) {
  return (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 999, background: C.offWhite + "F2", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid " + C.lightWarm, transform: visible ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.3s ease" }}><div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Link href="/" style={{ textDecoration: "none", fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.charcoal }}>TONE <span style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>TOKYO</span></Link><span style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{pillar}{readTime ? " \u00B7 " + readTime : ""}</span></div></div>);
}

const ptComponents = {
  block: {
    normal: ({ children }: any) => (<p style={{ fontFamily: F.body, fontSize: "clamp(16px, 1.8vw, 18px)", lineHeight: 1.8, color: C.charcoal, marginBottom: 24 }}>{children}</p>),
    h2: ({ children }: any) => (<h2 style={{ fontFamily: F.display, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: C.charcoal, margin: "44px 0 18px", lineHeight: 1.3 }}>{children}</h2>),
    h3: ({ children }: any) => (<h3 style={{ fontFamily: F.display, fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 700, color: C.charcoal, margin: "36px 0 14px", lineHeight: 1.35 }}>{children}</h3>),
    blockquote: ({ children }: any) => (<blockquote style={{ margin: "48px 0", padding: "0 0 0 28px", borderLeft: "3px solid " + C.indigo }}><p style={{ fontFamily: F.display, fontSize: "clamp(20px, 3vw, 26px)", fontStyle: "italic", lineHeight: 1.45, color: C.charcoal, margin: 0 }}>{children}</p></blockquote>),
  },
  marks: {
    strong: ({ children }: any) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    link: ({ children, value }: any) => (<a href={value?.href} target="_blank" rel="noopener noreferrer" style={{ color: C.indigo, textDecoration: "underline", textUnderlineOffset: 3 }}>{children}</a>),
  },
  types: {
    image: ({ value }: any) => {
      const url = value?.asset?._ref ? "https://cdn.sanity.io/images/w757ks40/production/" + value.asset._ref.replace("image-", "").replace("-jpg", ".jpg").replace("-png", ".png").replace("-webp", ".webp") : null;
      if (!url) return null;
      return (<figure style={{ margin: "40px -40px", padding: 0 }}><div style={{ width: "100%", aspectRatio: "3/2", overflow: "hidden", background: C.cream }}><img src={url} alt={value?.alt || ""} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>{(value?.caption || value?.alt) && <figcaption style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, lineHeight: 1.5, padding: "10px 40px 0" }}>{value?.caption || value?.alt}</figcaption>}</figure>);
    },
  },
};

function InfoBox({ article: a }: { article: any }) {
  const items: { label: string; value: string }[] = [];
  if (a.address) items.push({ label: "Address", value: a.address });
  if (a.area) items.push({ label: "Area", value: a.area });
  if (a.neighborhood) items.push({ label: "Neighborhood", value: a.neighborhood });
  if (a.eatPriceRange || a.priceRange) items.push({ label: "Price", value: a.eatPriceRange || a.priceRange });
  if (a.eatGenre) items.push({ label: "Genre", value: a.eatGenre });
  if (a.bookingDifficulty) items.push({ label: "Booking", value: a.bookingDifficulty });
  if (items.length === 0) return null;
  return (<div style={{ background: C.cream, border: "1px solid " + C.lightWarm, padding: "28px 32px", margin: "40px 0", borderRadius: 2 }}><div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 20 }}>Details</div>{items.map((item, i) => (<div key={i} style={{ marginBottom: i < items.length - 1 ? 14 : 0, display: "flex", gap: 12 }}><span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: C.charcoal, minWidth: 90, flexShrink: 0 }}>{item.label}</span><span style={{ fontFamily: F.body, fontSize: 14, color: C.charcoal, lineHeight: 1.5 }}>{item.value}</span></div>))}<div style={{ display: "flex", gap: 12, marginTop: 20 }}>{a.googleMapsUrl && <a href={a.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.indigo, textDecoration: "none", padding: "8px 16px", border: "1px solid " + C.indigo, borderRadius: 2 }}>MAP</a>}{a.officialUrl && <a href={a.officialUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.indigo, textDecoration: "none", padding: "8px 16px", border: "1px solid " + C.indigo, borderRadius: 2 }}>WEBSITE</a>}{a.tabelogUrl && <a href={a.tabelogUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.indigo, textDecoration: "none", padding: "8px 16px", border: "1px solid " + C.indigo, borderRadius: 2 }}>TABELOG</a>}</div></div>);
}
export default function ArticleClient({ article, related }: { article: any; related: any[] }) {
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = () => { if (heroRef.current) setStickyVisible(heroRef.current.getBoundingClientRect().bottom < 0); };
    window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn);
  }, []);
  const A = article;
  // Route the hero through @sanity/image-url so the editor's crop &
  // hotspot are honored AND so Sanity does the server-side crop at
  // 2400x1000 — same approach as HomeClient. urlForArticleImage falls
  // back to the coalesced URL string when the raw asset ref is missing.
  const heroImg = urlForArticleImage(A, { w: 2400, h: 1000, q: 85 }) || sizedImage(A.heroImage || FALLBACK, 2400);
  const pColor = pillarColor(A.pillar);
  return (<><ProgressBar /><StickyHeader visible={stickyVisible} pillar={A.pillar} readTime={A.readTime} /><div style={{ background: C.offWhite, minHeight: "100vh" }}>
    <nav style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 10, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><Link href="/" style={{ textDecoration: "none" }}><div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1 }}>TONE <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, letterSpacing: "0.15em" }}>TOKYO</span></div><div style={{ fontFamily: F.jp, fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3em", marginTop: 2 }}>{"\u97F3 \u6771\u4EAC"}</div></Link></nav>
    <div ref={heroRef} style={{ position: "relative", width: "100%", height: "70vh", minHeight: 420, maxHeight: 700, overflow: "hidden" }}><img src={heroImg} alt={A.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "linear-gradient(transparent, rgba(0,0,0,0.55))", height: "50%" }} />{A.heroCaption && <div style={{ position: "absolute", bottom: 16, right: 24, fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>{A.heroCaption}</div>}</div>
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
      <div style={{ padding: "40px 0 32px", borderBottom: "1px solid " + C.lightWarm, marginBottom: 36 }}>
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: pColor, marginBottom: 16 }}>{A.pillar}</div>
        <h1 style={{ fontFamily: F.display, fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.18, color: C.charcoal, margin: "0 0 16px" }}>{A.title}</h1>
        {A.subtitle && <p style={{ fontFamily: F.body, fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.55, color: C.warmGray, margin: "0 0 24px", fontStyle: "italic" }}>{A.subtitle}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: C.offWhite }}>T</div><div><div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.charcoal }}>The Editor</div><div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{fmtDate(A.publishedAt)}{A.readTime ? " \u00B7 " + A.readTime : ""}</div></div></div>
      </div>
      {(A.locationName || A.locationNameJa) && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "8px 14px", background: C.cream, borderRadius: 2 }}><span style={{ fontSize: 14 }}>{"\uD83D\uDCCD"}</span><span style={{ fontFamily: F.ui, fontSize: 12, color: C.charcoal }}>{A.locationName}</span>{A.locationNameJa && <span style={{ fontFamily: F.jp, fontSize: 11, color: C.warmGray }}>{A.locationNameJa}</span>}</div>}
      <div id="article-body">{A.body && Array.isArray(A.body) && A.body.length > 0 ? (A.body[0]?._type ? <PortableText value={A.body} components={ptComponents} /> : A.body.map((block: any, i: number) => {
        if (block.type === "lead") return <p key={i} style={{ fontFamily: F.body, fontSize: "clamp(18px, 2.2vw, 20px)", lineHeight: 1.75, color: C.charcoal, marginBottom: 28 }}><span style={{ fontFamily: F.display, fontSize: "clamp(44px, 5vw, 56px)", float: "left", lineHeight: 0.82, marginRight: 10, marginTop: 6, color: C.indigo, fontWeight: 700 }}>{block.text[0]}</span>{block.text.slice(1)}</p>;
        if (block.type === "paragraph") return <p key={i} style={{ fontFamily: F.body, fontSize: "clamp(16px, 1.8vw, 18px)", lineHeight: 1.8, color: C.charcoal, marginBottom: 24 }}>{block.text}</p>;
        if (block.type === "heading") return <h2 key={i} style={{ fontFamily: F.display, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: C.charcoal, margin: "44px 0 18px", lineHeight: 1.3 }}>{block.text}</h2>;
        if (block.type === "image") return <figure key={i} style={{ margin: "40px -40px", padding: 0 }}><div style={{ width: "100%", aspectRatio: "3/2", overflow: "hidden", background: C.cream }}><img src={block.src} alt={block.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>{block.caption && <figcaption style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, lineHeight: 1.5, padding: "10px 40px 0" }}>{block.caption}</figcaption>}</figure>;
        if (block.type === "pullquote") return <blockquote key={i} style={{ margin: "48px 0", padding: "0 0 0 28px", borderLeft: "3px solid " + C.indigo }}><p style={{ fontFamily: F.display, fontSize: "clamp(20px, 3vw, 26px)", fontStyle: "italic", lineHeight: 1.45, color: C.charcoal, margin: 0 }}>{block.text}</p>{block.attribution && <cite style={{ display: "block", marginTop: 14, fontFamily: F.ui, fontSize: 12, color: C.warmGray, fontStyle: "normal" }}>{"\u2014"}{block.attribution}</cite>}</blockquote>;
        if (block.type === "info_box") return <div key={i} style={{ background: C.cream, border: "1px solid " + C.lightWarm, padding: "28px 32px", margin: "40px 0", borderRadius: 2 }}><div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 20 }}>{block.title}</div>{block.items?.map((item: any, j: number) => <div key={j} style={{ marginBottom: j < block.items.length - 1 ? 14 : 0, display: "flex", gap: 12 }}><span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: C.charcoal, minWidth: 90, flexShrink: 0 }}>{item.label}</span><span style={{ fontFamily: F.body, fontSize: 14, color: C.charcoal, lineHeight: 1.5 }}>{item.value}</span></div>)}</div>;
        return null;
      })) : <p style={{ fontFamily: F.body, fontSize: 16, color: C.warmGray, padding: "40px 0" }}>Article content is being prepared...</p>}</div>
      <InfoBox article={A} />
      {A.tags && A.tags.length > 0 && <div style={{ padding: "36px 0", borderTop: "1px solid " + C.lightWarm, marginTop: 40 }}><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>{A.tags.map((tag: string, i: number) => <span key={i} style={{ padding: "6px 14px", background: C.cream, border: "1px solid " + C.lightWarm, borderRadius: 2, fontFamily: F.ui, fontSize: 11, color: C.charcoal }}>{tag}</span>)}</div></div>}
      <div style={{ padding: 32, background: C.cream, border: "1px solid " + C.lightWarm, display: "flex", gap: 20, alignItems: "flex-start", borderRadius: 2, marginTop: 20 }}><div style={{ width: 56, height: 56, borderRadius: "50%", background: C.indigo, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.offWhite }}>T</div><div><div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>The Editor</div><p style={{ fontFamily: F.body, fontSize: 14, color: C.warmGray, lineHeight: 1.6, margin: 0 }}>Travels the world, comes home to Tokyo. How things are made, where to find a great meal, and what makes this country worth paying attention to. Someone who knows Japan from the inside{"\u2014"}and from the outside looking back in.</p></div></div>
      {related.length > 0 && <div style={{ padding: "48px 0 0" }}><div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 24 }}>READ NEXT</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 28 }}>{related.map((r: any, i: number) => <Link key={i} href={"/article/" + r.slug} style={{ textDecoration: "none", color: "inherit" }}><div style={{ aspectRatio: "4/3", overflow: "hidden", background: C.cream, marginBottom: 14 }}><img src={urlForArticleImage(r, { w: 600, h: 450 }) || sizedImage(r.heroImage || FALLBACK, 600)} alt={r.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: pillarColor(r.pillar), marginBottom: 8 }}>{r.pillar}</div><div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, lineHeight: 1.35, color: C.charcoal, marginBottom: 6 }}>{r.title}</div><div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{r.readTime}</div></Link>)}</div></div>}
      <div style={{ background: C.indigo, color: C.offWhite, padding: "48px 32px", textAlign: "center" as const, margin: "60px -24px 0" }}><div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, opacity: 0.6, marginBottom: 12 }}>NEWSLETTER</div><div style={{ fontFamily: F.display, fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>This Week in Japan</div><p style={{ fontFamily: F.body, fontSize: 15, lineHeight: 1.6, opacity: 0.8, maxWidth: 420, margin: "0 auto 24px" }}>A weekly dispatch from Tokyo: what to wear, where to eat, what matters now.</p><div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}><input type="email" placeholder="you@email.com" style={{ flex: 1, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: C.offWhite, borderRadius: 2, fontFamily: F.ui, fontSize: 14, outline: "none" }} /><button style={{ padding: "12px 24px", background: C.offWhite, color: C.indigo, border: "none", borderRadius: 2, fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer" }}>SUBSCRIBE</button></div></div>
      <div style={{ padding: "40px 0 60px", textAlign: "center" as const }}><Link href="/" style={{ textDecoration: "none" }}><div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.charcoal }}>TONE <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, letterSpacing: "0.15em" }}>TOKYO</span></div><div style={{ fontFamily: F.jp, fontSize: 9, color: C.warmGray, letterSpacing: "0.3em", marginTop: 3 }}>{"\u97F3 \u6771\u4EAC"}</div></Link><p style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 16 }}>Japan, through the eyes of someone who lives it.</p><p style={{ fontFamily: F.ui, fontSize: 10, color: C.lightWarm, marginTop: 8 }}>{"\u00A9"} 2026 TONE TOKYO</p></div>
    </div>
  </div></>);
}