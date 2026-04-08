
"use client";
import { useState, useEffect, useRef } from "react";

const INDIGO = "#1B3A5C";
const CHARCOAL = "#2D2D2D";
const WARM_GRAY = "#A39E93";
const OFF_WHITE = "#F8F6F1";
const CREAM = "#F0EDE6";
const LIGHT_WARM = "#E8E4DB";

const FEATURED = {
  pillar: "CRAFT",
  title: "Inside Okayama\u2019s Last Generation of Selvedge Denim Weavers",
  excerpt: "At Collect Mills, three master weavers operate vintage shuttle looms that most factories abandoned decades ago.",
  image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1200&q=80",
  date: "Apr 5", readTime: "8 min",
};

const ARTICLES = [
  { pillar: "EAT", title: "The Six-Seat Counter in Sangenjaya You Need to Know", excerpt: "An ex-Fuunji chef doing extraordinary things with tsukemen.", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80", date: "Apr 4", readTime: "3 min" },
  { pillar: "FASHION", title: "AURALEE 26AW: A Quiet Revolution in Texture", excerpt: "A showroom visit that pushed Japanese minimalism into unexplored territory.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80", date: "Apr 3", readTime: "5 min" },
  { pillar: "CULTURE", title: "Saturday Night at Contact: Tokyo\u2019s Underground Pulse", excerpt: "Three generations of Tokyo\u2019s electronic music scene under one roof.", image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&q=80", date: "Apr 2", readTime: "4 min" },
  { pillar: "EXPERIENCE", title: "A Perfect Day in Tomigaya: The Insider\u2019s Route", excerpt: "Forget Shibuya Crossing. This quiet neighborhood is where Tokyo\u2019s real taste lives.", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80", date: "Apr 1", readTime: "6 min" },
];

const PICKS = [
  { title: "Morning coffee at Fuglen \u2014 still the best flat white in Tomigaya", pillar: "EAT", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
  { title: "New PRAS colorway dropping next week. The olive is perfect.", pillar: "FASHION", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&q=80" },
  { title: "This yakitori spot in Ebisu has zero English menu and zero tourists", pillar: "EAT", image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80" },
];

const PC: Record<string, string> = { CRAFT: "#8B6914", EAT: "#A0522D", FASHION: INDIGO, CULTURE: "#6B3A6B", EXPERIENCE: "#2E6B50" };

function Tag({ p }: { p: string }) {
  return <span style={{ fontFamily: "var(--serif)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: PC[p] || INDIGO, borderBottom: `1.5px solid ${PC[p] || INDIGO}`, paddingBottom: 1, display: "inline-block" }}>{p}</span>;
}

function useVisible(ref: React.RefObject<HTMLElement | null>, t = 0.1) {
  const [v, setV] = useState(true);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, [ref, t]);
  return v;
}

function Nav({ scrolled, onMenu }: { scrolled: boolean; onMenu: () => void }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(248,246,241,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${LIGHT_WARM}` : "none",
      transition: "all 0.4s ease",
    }}>
      <div style={{
        padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, maxWidth: 1200, margin: "0 auto",
      }}>
        <div style={{ transition: "opacity 0.4s ease" }}>
          {scrolled ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, color: CHARCOAL, letterSpacing: "-0.02em", lineHeight: 1 }}>TONE</span>
              <span style={{ fontFamily: "var(--sans)", fontSize: 6.5, fontWeight: 500, letterSpacing: "0.25em", color: WARM_GRAY, textTransform: "uppercase" as const, lineHeight: 1 }}>TOKYO</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>TONE</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 6.5, fontWeight: 500, letterSpacing: "0.28em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, lineHeight: 1 }}>TOKYO</span>
              </div>
              <div style={{ fontFamily: "var(--jp)", fontSize: 5.5, fontWeight: 300, letterSpacing: "0.45em", color: "rgba(255,255,255,0.4)", marginTop: 1, lineHeight: 1 }}>{"\u97F3 \u6771\u4EAC"}</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="#newsletter" className="nav-sub" style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: OFF_WHITE, background: INDIGO, padding: "6px 14px", textDecoration: "none", textTransform: "uppercase" as const }}>Subscribe</a>
          <button onClick={onMenu} className="nav-menu" aria-label="Menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column" as const, gap: 5, alignItems: "flex-end" }}>
            <span style={{ width: 22, height: 1.5, background: scrolled ? CHARCOAL : "#fff", transition: "background 0.4s", display: "block" }} />
            <span style={{ width: 15, height: 1.5, background: scrolled ? CHARCOAL : "#fff", transition: "background 0.4s", display: "block" }} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: CHARCOAL,
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      display: "flex", flexDirection: "column" as const, padding: "20px 24px", overflowY: "auto" as const,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, color: OFF_WHITE }}>TONE</span>
            <span style={{ fontFamily: "var(--sans)", fontSize: 6.5, fontWeight: 500, letterSpacing: "0.28em", color: WARM_GRAY, textTransform: "uppercase" as const }}>TOKYO</span>
          </div>
          <div style={{ fontFamily: "var(--jp)", fontSize: 5.5, fontWeight: 300, letterSpacing: "0.45em", color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{"\u97F3 \u6771\u4EAC"}</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: OFF_WHITE, fontSize: 28, lineHeight: 1, padding: 4 }}>{"\u00D7"}</button>
      </div>
      <nav style={{ display: "flex", flexDirection: "column" as const, flex: 1 }}>
        {["Fashion", "Eat", "Culture", "Experience", "Craft"].map((p, i) => (
          <a key={p} href="#" onClick={onClose} style={{
            fontFamily: "var(--serif)", fontSize: 28, fontWeight: 600, color: OFF_WHITE,
            textDecoration: "none", padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            opacity: open ? 1 : 0, transform: open ? "translateX(0)" : "translateX(30px)",
            transition: `all 0.35s ease ${i * 0.05}s`,
          }}>{p}</a>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {["Instagram", "X", "YouTube"].map(s => (
          <a key={s} href="#" style={{ fontFamily: "var(--sans)", fontSize: 11, color: WARM_GRAY, textDecoration: "none", letterSpacing: "0.05em" }}>{s}</a>
        ))}
      </div>
    </div>
  );
}

function Hero({ vis }: { vis: boolean }) {
  return (
    <section style={{ position: "relative", height: "85vh", minHeight: 480, overflow: "hidden", background: CHARCOAL }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${FEATURED.image})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "brightness(0.48) saturate(0.8)",
        transform: vis ? "scale(1)" : "scale(1.05)",
        transition: "transform 5s ease",
      }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "75%", background: "linear-gradient(transparent, rgba(0,0,0,0.7))", pointerEvents: "none" }} />
      <div style={{
        position: "relative", zIndex: 2, height: "100%",
        display: "flex", flexDirection: "column" as const, justifyContent: "flex-end",
        padding: "0 16px 36px 16px", maxWidth: 1200, margin: "0 auto",
      }}>
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)", transition: "all 0.9s ease 0.2s" }}>
          <Tag p={FEATURED.pillar} />
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 6.5vw, 48px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, margin: "8px 0", letterSpacing: "-0.015em" }}>
            {FEATURED.title}
          </h1>
          <p style={{ fontFamily: "var(--body)", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 12px 0" }}>
            {FEATURED.excerpt}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{FEATURED.date}</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{FEATURED.readTime}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticleRow({ a, i, vis }: { a: any; i: number; vis: boolean }) {
  return (
    <a href={a.slug ? "/article/" + a.slug : "#"} style={{
      display: "flex", gap: 14, textDecoration: "none", alignItems: "flex-start",
      paddingBottom: 16, borderBottom: `1px solid ${LIGHT_WARM}`,
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)",
      transition: `all 0.6s ease ${i * 0.08}s`,
    }}>
      <div style={{ width: 88, height: 88, flexShrink: 0, overflow: "hidden", background: LIGHT_WARM }}>
        <img src={a.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" as const, filter: "saturate(0.85)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Tag p={a.pillar} />
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 600, color: CHARCOAL, lineHeight: 1.3, margin: "4px 0" }}>{a.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>{a.date}</span>
          <span style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: LIGHT_WARM }} />
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>{a.readTime}</span>
        </div>
      </div>
    </a>
  );
}

function ArticleCard({ a, i, vis }: { a: any; i: number; vis: boolean }) {
  const [h, setH] = useState(false);
  return (
    <a href={a.slug ? "/article/" + a.slug : "#"} style={{
      display: "block", textDecoration: "none",
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
      transition: `all 0.7s ease ${i * 0.1}s`,
    }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div style={{ overflow: "hidden", aspectRatio: "3/2", marginBottom: 12, background: LIGHT_WARM }}>
        <img src={a.image} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover" as const, filter: "saturate(0.85)",
          transform: h ? "scale(1.04)" : "scale(1)", transition: "transform 0.6s ease",
        }} />
      </div>
      <Tag p={a.pillar} />
      <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 600, color: CHARCOAL, lineHeight: 1.3, margin: "6px 0 4px 0" }}>{a.title}</h3>
      <p style={{ fontFamily: "var(--body)", fontSize: 13, color: WARM_GRAY, lineHeight: 1.5, margin: 0 }}>{a.excerpt}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>{a.date}</span>
        <span style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: LIGHT_WARM }} />
        <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>{a.readTime}</span>
      </div>
    </a>
  );
}

function ArticlesSection({ articles: sanityArticles }: { articles?: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useVisible(ref);
  console.log("SANITY DATA:", sanityArticles?.map((a: any) => ({title: a.title, img: a.heroImage})));
return (
    <section ref={ref} style={{ padding: "40px 16px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20, borderBottom: `1px solid ${LIGHT_WARM}`, paddingBottom: 10 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, color: CHARCOAL }}>Latest</h2>
            <a href="#" style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: INDIGO, textDecoration: "none" }}>ALL →</a>
      </div>
      <div className="articles-mobile">
        {(sanityArticles && sanityArticles.length > 0 ? sanityArticles.filter(a => a.title && a.pillar).map(a => ({pillar: a.pillar, title: a.title, slug: a.slug, excerpt: a.subtitle || "", image: a.heroImage || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80", date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "", readTime: a.readTime || ""})) : ARTICLES).map((a, i) => <ArticleRow key={i} a={a} i={i} vis={vis} />)}
      </div>
      <div className="articles-desktop">
        {(sanityArticles && sanityArticles.length > 0 ? sanityArticles.filter(a => a.title && a.pillar).map(a => ({pillar: a.pillar, title: a.title, slug: a.slug, excerpt: a.subtitle || "", image: a.heroImage || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&q=80", date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "", readTime: a.readTime || ""})) : ARTICLES).map((a, i) => <ArticleCard key={i} a={a} i={i} vis={vis} />)}
      </div>
    </section>
  );
}

function PicksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useVisible(ref);
  return (
    <section ref={ref} style={{ background: CREAM, padding: "40px 16px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="picks-outer">
        <div className="picks-main">
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, color: CHARCOAL }}>Kentaro{"\u2019"}s Picks</h2>
            <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>Today</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {PICKS.map((pk, i) => (
              <a key={i} href="#" style={{
                display: "flex", gap: 12, textDecoration: "none", alignItems: "flex-start",
                paddingBottom: 14, borderBottom: `1px solid ${LIGHT_WARM}`,
                opacity: vis ? 1 : 0, transform: vis ? "translateX(0)" : "translateX(14px)",
                transition: `all 0.5s ease ${i * 0.08}s`,
              }}>
                <div style={{ width: 60, height: 60, flexShrink: 0, overflow: "hidden", background: LIGHT_WARM }}>
                  <img src={pk.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" as const, filter: "saturate(0.8)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Tag p={pk.pillar} />
                  <p style={{ fontFamily: "var(--body)", fontSize: 14, color: CHARCOAL, lineHeight: 1.4, margin: "3px 0 0 0" }}>{pk.title}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="nl-section" id="newsletter">
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: INDIGO, display: "block", marginBottom: 8 }}>Newsletter</span>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: CHARCOAL, lineHeight: 1.2, marginBottom: 8 }}>This Week in Japan</h2>
          <p style={{ fontFamily: "var(--body)", fontSize: 13, color: WARM_GRAY, lineHeight: 1.5, marginBottom: 16 }}>
            A weekly dispatch from inside Tokyo{"\u2019"}s fashion, food, and culture scene.
          </p>
          <div style={{ display: "flex" }}>
            <input type="email" placeholder="your@email.com" style={{
              flex: 1, padding: "11px 12px", fontFamily: "var(--sans)", fontSize: 14,
              border: `1px solid ${LIGHT_WARM}`, borderRight: "none", background: OFF_WHITE,
              color: CHARCOAL, outline: "none", borderRadius: 0, WebkitAppearance: "none" as const, minWidth: 0,
            }} />
            <button style={{
              padding: "11px 16px", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase" as const, background: INDIGO,
              color: OFF_WHITE, border: "none", cursor: "pointer", whiteSpace: "nowrap" as const,
            }}>Subscribe</button>
          </div>
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY, marginTop: 6, display: "block" }}>Free. Every Friday.</span>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section style={{ background: CHARCOAL, padding: "48px 16px" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" as const }}>
        <div style={{
          width: 44, height: 44, background: INDIGO,
          margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 700, color: OFF_WHITE, letterSpacing: "-0.03em" }}>T</span>
        </div>
        <p style={{ fontFamily: "var(--body)", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, fontStyle: "italic" }}>
          TONE TOKYO is curated by Kentaro Osakabe {"\u2014"} fashion industry professional, brand owner, and lifelong Tokyo resident. Every recommendation comes from personal experience.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
          {["Instagram", "X", "YouTube"].map(s => (
            <a key={s} href="#" style={{ fontFamily: "var(--sans)", fontSize: 10, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>{s}</a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "24px 16px", background: OFF_WHITE, borderTop: `1px solid ${LIGHT_WARM}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 700, color: CHARCOAL }}>TONE</span>
          <span style={{ fontFamily: "var(--sans)", fontSize: 7, fontWeight: 500, letterSpacing: "0.2em", color: WARM_GRAY, textTransform: "uppercase" as const }}>TOKYO</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["About", "Contact"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY, textDecoration: "none" }}>{l}</a>
          ))}
          <span style={{ fontFamily: "var(--sans)", fontSize: 10, color: WARM_GRAY }}>{"\u00A9"} 2026</span>
        </div>
      </div>
    </footer>
  );
}

export default function HomeClient({ articles }: { articles?: any[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [heroVis, setHeroVis] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVis(true), 80);
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div style={{ background: OFF_WHITE, minHeight: "100vh", overflowX: "hidden" as const }}>
      <Nav scrolled={scrolled} onMenu={() => setMenuOpen(true)} />
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Hero vis={heroVis} />
      <div style={{ background: CHARCOAL, padding: "12px 16px", textAlign: "center" as const }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)" }}>
          Japan, through the eyes of someone who lives it
        </span>
      </div>
      <ArticlesSection articles={articles} />
      <PicksSection />
      <About />
      <Footer />
    </div>
  );
}


