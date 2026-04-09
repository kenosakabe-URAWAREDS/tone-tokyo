"use client";
import { useState } from "react";
import Link from "next/link";

const C = { indigo: "#1B3A5C", charcoal: "#2D2D2D", warmGray: "#A39E93", offWhite: "#F8F6F1", cream: "#F0EDE6", lightWarm: "#E8E4DB" };
const F = { display: "'Playfair Display', Georgia, serif", body: "'Source Serif 4', Georgia, serif", ui: "'DM Sans', 'Helvetica Neue', sans-serif" };

const PILLARS = ["All", "EAT", "FASHION", "CRAFT", "CULTURE", "EXPERIENCE"];
const AREAS = ["All", "Tokyo", "Osaka", "Kyoto", "Fukuoka", "Okayama", "Kurume", "Hokkaido", "Okinawa", "Nagoya", "Kobe", "Other"];
const GENRES = ["All", "Ramen", "Sushi", "Yakitori", "Yakiniku", "Curry", "Soba / Udon", "Italian", "French", "Chinese", "Cafe", "Bar", "Izakaya", "Bakery", "Sweets"];
const BOOKING = ["Walk-in OK", "Easy to book", "Book ahead", "Hard to get"];
const DRINKS = ["Sake", "Natural Wine", "Craft Beer", "Whisky / Bourbon", "Cocktails", "Shochu / Awamori", "Non-alcohol"];
const SCENES = ["Solo dining", "Date", "Business dinner", "Friends", "Late night (after 22:00)", "Breakfast / Brunch", "Family"];
const PRICES = ["~\u00a51,000", "~\u00a53,000", "~\u00a55,000", "~\u00a510,000", "\u00a510,000+"];

function bookingColor(b: string) {
  if (b === "Walk-in OK" || b === "Easy to book") return { bg: "#EAF3DE", color: "#3B6D11" };
  if (b === "Book ahead") return { bg: "#FAEED4", color: "#854F0B" };
  if (b === "Hard to get") return { bg: "#FCEBEB", color: "#A32D2D" };
  return { bg: C.cream, color: C.warmGray };
}
function Stars({ n }: { n: number }) { return <span style={{ color: "#BA7517", fontSize: 12, letterSpacing: 1 }}>{"\u2605".repeat(n)}</span>; }
function Pill({ text, bg, color }: { text: string; bg?: string; color?: string }) { return <span style={{ fontFamily: F.ui, fontSize: 10, padding: "2px 8px", borderRadius: 10, background: bg || C.cream, color: color || C.warmGray }}>{text}</span>; }
function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (<button onClick={onClick} style={{ fontFamily: F.ui, fontSize: 12, padding: "6px 14px", borderRadius: 20, border: active ? "1px solid " + C.indigo : "1px solid " + C.lightWarm, background: active ? C.indigo : C.offWhite, color: active ? C.offWhite : C.charcoal, cursor: "pointer", transition: "all 0.15s" }}>{label}</button>);
}
function pillarColor(p?: string) {
  const m: Record<string, string> = { FASHION: "#1B3A5C", EAT: "#8B4513", CULTURE: "#6B2D5B", EXPERIENCE: "#2D5B3A", CRAFT: "#5B4B2D" };
  return m[p?.toUpperCase() || ""] || C.indigo;
}
function pillarEmoji(p?: string) {
  const m: Record<string, string> = { EAT: "\uD83C\uDF7D", FASHION: "\uD83E\uDDE5", CRAFT: "\uD83E\uDDF5", CULTURE: "\uD83C\uDFB6", EXPERIENCE: "\uD83D\uDDFE" };
  return m[p?.toUpperCase() || ""] || "";
}
export default function EatClient({ articles, initialPillar = "All" }: { articles: any[]; initialPillar?: string }) {
  const [pillar, setPillar] = useState(initialPillar);
  const [area, setArea] = useState("All");
  const [genre, setGenre] = useState("All");
  const [booking, setBooking] = useState<string[]>([]);
  const [drinks, setDrinks] = useState<string[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [price, setPrice] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);

  const tog = (arr: string[], val: string) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  const isEat = pillar === "All" || pillar === "EAT";

  const filtered = articles.filter(a => {
    if (pillar !== "All" && a.pillar?.toUpperCase() !== pillar) return false;
    if (area !== "All" && a.area !== area) return false;
    if (isEat) {
      if (genre !== "All" && a.eatGenre !== genre) return false;
      if (booking.length > 0 && !booking.includes(a.bookingDifficulty)) return false;
      if (drinks.length > 0 && !(a.drinks || []).some((d: string) => drinks.includes(d))) return false;
      if (scenes.length > 0 && !(a.scene || []).some((s: string) => scenes.includes(s))) return false;
      if (price.length > 0 && !price.includes(a.eatPriceRange)) return false;
    }
    return true;
  });

  const hasFilters = pillar !== "All" || area !== "All" || genre !== "All" || booking.length > 0 || drinks.length > 0 || scenes.length > 0 || price.length > 0;
  const title = pillar === "All" ? "DISCOVER" : pillar;
  const subtitle = pillar === "All" ? "The Editor\u2019s picks \u2014 the best of Japan, curated" : pillar === "EAT" ? "The Editor\u2019s picks \uD83C\uDF7D \u00B7 where to eat and drink in Japan" : pillar === "FASHION" ? "The Editor\u2019s picks \uD83E\uDDE5 \u00B7 Japanese fashion worth knowing" : pillar === "CRAFT" ? "The Editor\u2019s picks \uD83E\uDDF5 \u00B7 makers, materials, and process" : pillar === "CULTURE" ? "The Editor\u2019s picks \uD83C\uDFB6 \u00B7 music, art, and nightlife" : "The Editor\u2019s picks \uD83D\uDDFE \u00B7 where to go and what to do";

  return (
    <div style={{ background: C.offWhite, minHeight: "100vh" }}>
      <div style={{ padding: "20px 16px 0", maxWidth: 800, margin: "0 auto" }}>
        <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(248,246,241,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid #E8E4DB` }}>
        <div style={{ padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, maxWidth: 1200, margin: "0 auto" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#2D2D2D", letterSpacing: "-0.02em", lineHeight: 1 }}>TONE</span>
                <span style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", fontSize: 16, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#A39E93", lineHeight: 1 }}>TOKYO</span>
              </div>
              <div style={{ fontFamily: "var(--jp)", fontSize: 9, fontWeight: 300, letterSpacing: "0.3em", color: "rgba(45,45,45,0.4)", marginTop: 1, lineHeight: 1 }}>{"\u97F3 \u6771\u4EAC"}</div>
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/discover" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#1B3A5C", textDecoration: "none", textTransform: "uppercase" as const }}>Discover</Link>
            <a href="#newsletter" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#F8F6F1", textDecoration: "none", background: "#1B3A5C", padding: "6px 14px", borderRadius: 20, textTransform: "uppercase" as const }}>Subscribe</a>
          </div>
        </div>
      </header>
      <div style={{ height: 52 }} />
        <h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 700, color: C.indigo, marginBottom: 4 }}>{title}</h1>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: C.warmGray, letterSpacing: "0.04em", marginBottom: 20 }}>{subtitle}</p>
        <div style={{ height: 1, background: C.lightWarm, marginBottom: 20 }} />

        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 10 }}>Pillar</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
          {PILLARS.map(p => <FilterBtn key={p} label={p} active={pillar === p} onClick={() => { setPillar(p); if (p !== "EAT" && p !== "All") { setGenre("All"); setBooking([]); setDrinks([]); setScenes([]); setPrice([]); setShowMore(false); } }} />)}
        </div>

        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 10 }}>Area</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
          {AREAS.map(a => <FilterBtn key={a} label={a} active={area === a} onClick={() => setArea(a)} />)}
        </div>

        {isEat && (<>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 10 }}>Genre</div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
            {GENRES.map(g => <FilterBtn key={g} label={g} active={genre === g} onClick={() => setGenre(g)} />)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 8 }}>
            {BOOKING.map(b => <FilterBtn key={b} label={b} active={booking.includes(b)} onClick={() => setBooking(tog(booking, b))} />)}
          </div>
          <button onClick={() => setShowMore(!showMore)} style={{ fontFamily: F.ui, fontSize: 12, color: C.indigo, background: "none", border: "none", cursor: "pointer", padding: "8px 0", textDecoration: "underline" }}>{showMore ? "Hide filters" : "More filters (drinks, scene, price)"}</button>
          {showMore && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 8 }}>Drinks</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>{DRINKS.map(d => <FilterBtn key={d} label={d} active={drinks.includes(d)} onClick={() => setDrinks(tog(drinks, d))} />)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 8 }}>Scene</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>{SCENES.map(s => <FilterBtn key={s} label={s} active={scenes.includes(s)} onClick={() => setScenes(tog(scenes, s))} />)}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 8 }}>Price</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>{PRICES.map(p => <FilterBtn key={p} label={p} active={price.includes(p)} onClick={() => setPrice(tog(price, p))} />)}</div>
            </div>
          )}
        </>)}

        {hasFilters && (<button onClick={() => { setPillar("All"); setArea("All"); setGenre("All"); setBooking([]); setDrinks([]); setScenes([]); setPrice([]); }} style={{ fontFamily: F.ui, fontSize: 12, color: "#A32D2D", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>Clear all filters</button>)}
        <div style={{ height: 1, background: C.lightWarm, margin: "16px 0" }} />
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.warmGray, marginBottom: 16 }}>
          {filtered.length} {filtered.length === 1 ? "place" : "places"}
        </div>
      </div>

      <div style={{ padding: "0 16px 60px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {filtered.map((a: any) => (
            <Link key={a._id} href={"/article/" + a.slug} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", gap: 14, padding: 12, border: "1px solid " + C.lightWarm, borderRadius: 8, background: "#fff", cursor: "pointer", transition: "all 0.15s" }}>
                <img src={a.heroImage || "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=220&q=80"} alt={a.title} style={{ width: 100, height: 100, borderRadius: 6, objectFit: "cover" as const, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: "center", minWidth: 0 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: pillarColor(a.pillar), marginBottom: 3 }}>
                    {a.eatGenre || a.pillar || "Eat"}{a.neighborhood ? " \u00B7 " + a.neighborhood : a.area ? " \u00B7 " + a.area : ""}
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: C.charcoal, marginBottom: 3 }}>{a.title}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.warmGray, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{a.subtitle}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" as const }}>
                    {a.editorRating && <Stars n={a.editorRating} />}
                    {a.bookingDifficulty && <Pill text={a.bookingDifficulty} bg={bookingColor(a.bookingDifficulty).bg} color={bookingColor(a.bookingDifficulty).color} />}
                    {a.drinks && a.drinks.slice(0, 2).map((d: string) => <Pill key={d} text={d} />)}
                    {a.eatPriceRange && <Pill text={a.eatPriceRange} />}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: 40, color: C.warmGray, fontFamily: F.ui, fontSize: 14 }}>No places match your filters. Try adjusting them.</div>
        )}
      </div>
    </div>
  );
}





