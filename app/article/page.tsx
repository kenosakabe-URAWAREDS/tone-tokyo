"use client";
import { useState, useEffect, useRef } from "react";

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

const A = {
  pillar: "CRAFT",
  title: "Inside Okayama\u2019s Last Generation of Selvedge Denim Weavers",
  subtitle: "At Collect Mills, three master weavers operate vintage shuttle looms that most factories abandoned decades ago. I spent a morning watching them work.",
  author: "The Editor",
  date: "April 5, 2026",
  readTime: "8 min read",
  location: { name: "Collect Mills, Kojima, Okayama", nameJa: "\u30b3\u30ec\u30af\u30c8\u30df\u30eb\u30ba\u30fb\u5150\u5cf6\u30fb\u5ca1\u5c71" },
  heroImage: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=1400&q=85",
  heroCaption: "The weaving floor at Collect Mills, where shuttle looms from the 1960s still run daily.",
  body: [
    { type: "lead", text: "The sound hits you before anything else. Not the mechanical drone of a modern factory\u2014this is something older, more rhythmic. A wooden shuttle flying across forty inches of warp thread, the clack of the beater bar, the gentle whir of the take-up roll. At Collect Mills in Kojima, Okayama, three men operate looms that most of the world\u2019s denim industry discarded half a century ago." },
    { type: "paragraph", text: "I\u2019ve been coming to Okayama\u2019s denim mills for over a decade. As someone who works with these fabrics daily, I\u2019ve seen the inside of most major mills in the region. But Collect is different. Where other mills have modernized\u2014faster looms, higher output, digital monitoring\u2014Collect has doubled down on the old way." },
    { type: "heading", text: "Why Shuttle Looms Matter" },
    { type: "paragraph", text: "Modern projectile looms weave denim at roughly 1,200 picks per minute. A vintage Toyoda shuttle loom, like the ones at Collect, manages about 200. That difference isn\u2019t just speed\u2014it changes the fabric fundamentally. The slower pace creates a slightly uneven weave with natural tension variations that give the denim its texture, its \u201Cslubby\u201D character, and ultimately, its ability to fade in that distinctive way that denim collectors obsess over." },
    { type: "image", src: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1100&q=80", caption: "The selvedge edge\u2014the clean, self-finished edge of fabric that can only be produced on a shuttle loom.", alt: "Close-up of selvedge denim edge" },
    { type: "paragraph", text: "The selvedge edge itself\u2014that clean, self-finished border that gives selvedge denim its name\u2014is a byproduct of this process. On a shuttle loom, the weft thread runs continuously back and forth, creating a closed edge. On modern looms, the weft is cut at each side, leaving an open, fraying edge that needs to be finished separately." },
    { type: "heading", text: "The Men Behind the Looms" },
    { type: "paragraph", text: "Yamamoto-san has been weaving denim for thirty-seven years. He started at the old Kurabo mill before joining Collect in the 1990s. When I ask him about the difference between then and now, he pauses for a long time before answering: \u201CThe looms are the same. The cotton is mostly the same. But there are fewer of us who understand what the loom is telling you.\u201D" },
    { type: "pullquote", text: "\u201CThere are fewer of us who understand what the loom is telling you.\u201D", attribution: "Yamamoto-san, master weaver, 37 years" },
    { type: "paragraph", text: "This is the real crisis facing Japan\u2019s heritage denim industry. The looms can be maintained\u2014parts can be fabricated, mechanisms can be rebuilt. But the knowledge of how to listen to a loom, how to feel when the tension is slightly off, how to adjust by instinct rather than digital readout\u2014that knowledge lives in the hands and ears of craftspeople who are now in their sixties and seventies." },
    { type: "image", src: "https://images.unsplash.com/photo-1617952385804-7b326fa42766?w=1100&q=80", caption: "14oz left-hand twill coming off the loom. Fabric like this takes patience\u2014and decades of experience.", alt: "Denim fabric on loom" },
    { type: "heading", text: "The 16oz Left-Hand Twill" },
    { type: "paragraph", text: "The reason for my visit today: Collect is developing a 16oz left-hand twill that I\u2019ve been following closely. Left-hand twill is less common than the standard right-hand twill\u2014it produces a flatter surface with a softer hand feel, and it fades differently, creating a more vertical, rain-like pattern rather than the diagonal lines of right-hand twill." },
    { type: "paragraph", text: "At 16oz, this is a substantial fabric\u2014heavier than most Japanese selvedge on the market, which tends to sit in the 12\u201314oz range. The extra weight means more indigo, which means more fade potential over time. For the right customer\u2014someone who wants jeans that will develop a genuinely personal patina over years of wear\u2014this is as good as it gets." },
    { type: "heading", text: "Visiting Kojima" },
    { type: "paragraph", text: "If you\u2019re planning a trip to Japan and care about denim, Kojima is worth the detour. It\u2019s about an hour from Okayama Station by train, or you can rent a car and combine it with a visit to Onomichi or Naoshima. The main Jeans Street in Kojima is a bit touristy, but the mills themselves\u2014Collect, Kuroki, Nihon Menpu\u2014are where the real story is." },
    { type: "info_box", title: "Getting There", items: [{ label: "From Tokyo", value: "Shinkansen to Okayama (3h 20min), then JR Seto-Ohashi Line to Kojima (50min)" }, { label: "From Osaka", value: "Shinkansen to Okayama (45min), then local line" }, { label: "Best time", value: "Weekdays\u2014mills are quieter and you may get a tour if you arrange in advance" }, { label: "Note", value: "Most mills require advance appointment for visits. Contact through their websites." }] },
    { type: "paragraph", text: "Every time I come here, I leave with the same feeling: that the best things in Japan are the things that refuse to rush. These looms, these weavers, this process\u2014they exist because someone decided that the result was worth the time. In a world that optimizes for speed, that\u2019s a radical position. And it\u2019s one I\u2019ll keep supporting." },
  ],
  tags: ["Okayama", "Selvedge Denim", "Japanese Manufacturing", "Kojima", "Collect Mills", "Craft"],
  related: [
    { pillar: "FASHION", title: "10 Japanese Denim Brands the World Needs to Know", image: "https://images.unsplash.com/photo-1565084888279-aca5ecc8f8e7?w=400&q=80", readTime: "6 min" },
    { pillar: "CRAFT", title: "Why Vulcanized Sneakers Are Japan\u2019s Best-Kept Secret", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80", readTime: "5 min" },
    { pillar: "EXPERIENCE", title: "Beyond Tokyo: A Denim Lover\u2019s Guide to Okayama", image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80", readTime: "7 min" },
  ],
};

function ProgressBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => { const el = document.getElementById("article-body"); if (!el) return; const r = el.getBoundingClientRect(); setP(Math.min(100, (Math.max(0, -r.top) / (el.scrollHeight - window.innerHeight * 0.5)) * 100)); };
    window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn);
  }, []);
  return (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: 3, zIndex: 1000 }}><div style={{ height: "100%", width: p + "%", background: C.indigo, transition: "width 0.1s linear" }} /></div>);
}

function StickyHeader({ visible }: { visible: boolean }) {
  return (<div style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 999, background: C.offWhite + "F2", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid " + C.lightWarm, transform: visible ? "translateY(0)" : "translateY(-100%)", transition: "transform 0.3s ease" }}><div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><a href="/" style={{ textDecoration: "none", fontFamily: F.display, fontSize: 18, fontWeight: 700, color: C.charcoal }}>TONE <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, letterSpacing: "0.15em" }}>TOKYO</span></a><span style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{A.pillar} · {A.readTime}</span></div></div>);
}

function InfoBox({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (<div style={{ background: C.cream, border: "1px solid " + C.lightWarm, padding: "28px 32px", margin: "40px 0", borderRadius: 2 }}><div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.indigo, marginBottom: 20 }}>{title}</div>{items.map((item, i) => (<div key={i} style={{ marginBottom: i < items.length - 1 ? 14 : 0, display: "flex", gap: 12 }}><span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: C.charcoal, minWidth: 90, flexShrink: 0 }}>{item.label}</span><span style={{ fontFamily: F.body, fontSize: 14, color: C.charcoal, lineHeight: 1.5 }}>{item.value}</span></div>))}</div>);
}

function PullQuote({ text, attribution }: { text: string; attribution?: string }) {
  return (<blockquote style={{ margin: "48px 0", padding: "0 0 0 28px", borderLeft: "3px solid " + C.indigo }}><p style={{ fontFamily: F.display, fontSize: "clamp(20px, 3vw, 26px)", fontStyle: "italic", lineHeight: 1.45, color: C.charcoal, margin: 0 }}>{text}</p>{attribution && <cite style={{ display: "block", marginTop: 14, fontFamily: F.ui, fontSize: 12, color: C.warmGray, fontStyle: "normal" }}>{"\u2014 " + attribution}</cite>}</blockquote>);
}

function ArticleImage({ src, caption, alt }: { src: string; caption?: string; alt: string }) {
  return (<figure className="article-image-wide" style={{ margin: "40px -40px", padding: 0 }}><div style={{ width: "100%", aspectRatio: "3/2", overflow: "hidden", background: C.cream }}><img src={src} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>{caption && <figcaption style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, lineHeight: 1.5, padding: "10px 40px 0", fontStyle: "italic" }}>{caption}</figcaption>}</figure>);
}

function Block({ block, i }: { block: any; i: number }) {
  if (block.type === "lead") return (<p key={i} style={{ fontFamily: F.body, fontSize: "clamp(18px, 2.2vw, 20px)", lineHeight: 1.75, color: C.charcoal, marginBottom: 28 }}><span style={{ fontFamily: F.display, fontSize: "clamp(44px, 5vw, 56px)", float: "left", lineHeight: 0.82, marginRight: 10, marginTop: 6, color: C.indigo, fontWeight: 700 }}>{block.text[0]}</span>{block.text.slice(1)}</p>);
  if (block.type === "paragraph") return (<p key={i} style={{ fontFamily: F.body, fontSize: "clamp(16px, 1.8vw, 18px)", lineHeight: 1.8, color: C.charcoal, marginBottom: 24 }}>{block.text}</p>);
  if (block.type === "heading") return (<h2 key={i} style={{ fontFamily: F.display, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: C.charcoal, margin: "44px 0 18px", lineHeight: 1.3 }}>{block.text}</h2>);
  if (block.type === "image") return <ArticleImage key={i} src={block.src} caption={block.caption} alt={block.alt} />;
  if (block.type === "pullquote") return <PullQuote key={i} text={block.text} attribution={block.attribution} />;
  if (block.type === "info_box") return <InfoBox key={i} title={block.title} items={block.items} />;
  return null;
}

export default function ArticlePage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = () => { if (heroRef.current) setStickyVisible(heroRef.current.getBoundingClientRect().bottom < 0); };
    window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn);
  }, []);

  return (<><ProgressBar /><StickyHeader visible={stickyVisible} /><div style={{ background: C.offWhite, minHeight: "100vh" }}>
    <div ref={heroRef}>
      <nav style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 10, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <a href="/" style={{ textDecoration: "none" }}><div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1 }}>TONE <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 16, letterSpacing: "0.15em" }}>TOKYO</span></div><div style={{ fontFamily: F.jp, fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: "0.3em", marginTop: 2 }}>{"\u97f3 \u6771\u4eac"}</div></a>
        <button style={{ padding: "8px 18px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 2, color: "#fff", fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" }}>SUBSCRIBE</button>
      </nav>
      <div style={{ position: "relative", width: "100%", height: "70vh", minHeight: 420, maxHeight: 700, overflow: "hidden" }}>
        <img src={A.heroImage} alt={A.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "linear-gradient(transparent, rgba(0,0,0,0.55))", height: "50%" }} />
        <div style={{ position: "absolute", bottom: 16, right: 24, fontFamily: F.ui, fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>{A.heroCaption}</div>
      </div>
    </div>
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
      <div style={{ padding: "40px 0 32px", borderBottom: "1px solid " + C.lightWarm, marginBottom: 36 }}>
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.indigo, marginBottom: 16 }}>{A.pillar}</div>
        <h1 style={{ fontFamily: F.display, fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.18, color: C.charcoal, margin: "0 0 16px" }}>{A.title}</h1>
        <p style={{ fontFamily: F.body, fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.55, color: C.warmGray, margin: "0 0 24px", fontStyle: "italic" }}>{A.subtitle}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: C.offWhite }}>T</div>
          <div><div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.charcoal }}>{A.author}</div><div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{A.date} · {A.readTime}</div></div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "8px 14px", background: C.cream, borderRadius: 2 }}>
          <span style={{ fontSize: 14 }}>{"\ud83d\udccd"}</span><span style={{ fontFamily: F.ui, fontSize: 12, color: C.charcoal }}>{A.location.name}</span><span style={{ fontFamily: F.jp, fontSize: 11, color: C.warmGray }}>{A.location.nameJa}</span>
        </div>
      </div>
      <div id="article-body">{A.body.map((block, i) => <Block key={i} block={block} i={i} />)}</div>
      <div style={{ padding: "36px 0", borderTop: "1px solid " + C.lightWarm, marginTop: 40 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{A.tags.map((tag, i) => (<a key={i} href="#" style={{ padding: "6px 14px", background: C.cream, border: "1px solid " + C.lightWarm, borderRadius: 2, fontFamily: F.ui, fontSize: 11, color: C.charcoal }}>{tag}</a>))}</div>
      </div>
      <div style={{ padding: 32, background: C.cream, border: "1px solid " + C.lightWarm, display: "flex", gap: 20, alignItems: "flex-start", borderRadius: 2 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.indigo, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.offWhite }}>T</div>
        <div><div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>The Editor</div><p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: C.warmGray, margin: 0 }}>Travels the world, comes home to Tokyo. How things are made, where to find a great meal, and what makes this country worth paying attention to. Someone who knows Japan from the inside{"\u2014"}and from the outside looking back in.</p></div>
      </div>
      <div style={{ padding: "48px 0 0" }}>
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.warmGray, marginBottom: 24 }}>READ NEXT</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 28 }}>{A.related.map((r, i) => (<a key={i} href="#" style={{ textDecoration: "none", color: "inherit" }}><div style={{ aspectRatio: "4/3", overflow: "hidden", background: C.cream, marginBottom: 14 }}><img src={r.image} alt={r.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.indigo, marginBottom: 8 }}>{r.pillar}</div><div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, lineHeight: 1.35, color: C.charcoal, marginBottom: 6 }}>{r.title}</div><div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{r.readTime}</div></a>))}</div>
      </div>
      <div style={{ background: C.indigo, color: C.offWhite, padding: "48px 32px", textAlign: "center", margin: "60px -24px 0" }}>
        <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.6, marginBottom: 12 }}>NEWSLETTER</div>
        <div style={{ fontFamily: F.display, fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>This Week in Japan</div>
        <p style={{ fontFamily: F.body, fontSize: 15, lineHeight: 1.6, opacity: 0.8, maxWidth: 420, margin: "0 auto 24px" }}>A weekly dispatch from Tokyo: what to wear, where to eat, what matters now.</p>
        <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
          <input type="email" placeholder="you@email.com" style={{ flex: 1, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)", color: C.offWhite, borderRadius: 2, fontFamily: F.ui, fontSize: 14, outline: "none" }} />
          <button style={{ padding: "12px 24px", background: C.offWhite, color: C.indigo, border: "none", borderRadius: 2, fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer" }}>SUBSCRIBE</button>
        </div>
      </div>
      <div style={{ padding: "40px 0 60px", textAlign: "center" }}>
        <a href="/" style={{ textDecoration: "none" }}><div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.charcoal }}>TONE <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 14, letterSpacing: "0.15em" }}>TOKYO</span></div><div style={{ fontFamily: F.jp, fontSize: 9, color: C.warmGray, letterSpacing: "0.3em", marginTop: 3 }}>{"\u97f3 \u6771\u4eac"}</div></a>
        <p style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 16 }}>Japan, through the eyes of someone who lives it.</p>
        <p style={{ fontFamily: F.ui, fontSize: 10, color: C.lightWarm, marginTop: 8 }}>{"\u00a9"} 2026 TONE TOKYO</p>
      </div>
    </div>
  </div></>);
}
