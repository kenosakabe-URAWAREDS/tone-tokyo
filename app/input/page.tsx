"use client";
import { useState, useRef } from "react";

const C = { indigo: "#1B3A5C", charcoal: "#2D2D2D", warmGray: "#A39E93", offWhite: "#F8F6F1", cream: "#F0EDE6", lightWarm: "#E8E4DB" };
const F = { display: "'Playfair Display', Georgia, serif", body: "'Source Serif 4', Georgia, serif", ui: "'DM Sans', 'Helvetica Neue', sans-serif" };

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}

type Pillar = "FASHION" | "EAT" | "CULTURE" | "EXPERIENCE" | "CRAFT" | "FAMILY";

const PILLARS: Array<{ key: Pillar; label: string; emoji: string }> = [
  { key: "FASHION", label: "Fashion", emoji: "👕" },
  { key: "EAT", label: "Eat", emoji: "🍜" },
  { key: "CULTURE", label: "Culture", emoji: "🎭" },
  { key: "EXPERIENCE", label: "Experience", emoji: "🗺️" },
  { key: "CRAFT", label: "Craft", emoji: "🛠️" },
  { key: "FAMILY", label: "Family", emoji: "🧸" },
];

// Pillar-specific question schemas. Each field maps to a label.
// All fields are optional except `comment` (the editor's one-liner).
type PillarFields = Record<string, string>;

const PILLAR_FIELDS: Record<Pillar, Array<{ key: string; label: string; placeholder?: string }>> = {
  EAT: [
    { key: "name", label: "店名", placeholder: "麺屋 まる / Mengyo Maru" },
    { key: "area", label: "場所（エリア）", placeholder: "三軒茶屋 / Sangenjaya" },
    { key: "ate", label: "何を食べた？おすすめは？", placeholder: "醤油ラーメン、つけ麺。醤油が看板。" },
    { key: "price", label: "価格帯", placeholder: "¥1,000-2,000" },
    { key: "comment", label: "一言コメント *", placeholder: "麺がしっかり、スープが絶品" },
  ],
  FASHION: [
    { key: "name", label: "ブランド名 / 店名", placeholder: "AURALEE" },
    { key: "feature", label: "何が特徴？", placeholder: "素材使い、テクスチャー、生地の選び方" },
    { key: "audience", label: "誰向け？", placeholder: "30代、ミニマル志向、長く着られる服を探す人" },
    { key: "price", label: "価格帯", placeholder: "ジャケット ¥50,000~" },
    { key: "comment", label: "一言コメント *", placeholder: "26AWは特にニットが良かった" },
  ],
  CULTURE: [
    { key: "name", label: "名前 / 場所", placeholder: "Contact Tokyo" },
    { key: "feature", label: "何が特徴？", placeholder: "クラブ。サウンドシステムが東京随一" },
    { key: "when", label: "いつ行った？", placeholder: "土曜の深夜" },
    { key: "audience", label: "誰向け？", placeholder: "テクノ・ハウス好きの大人" },
    { key: "comment", label: "一言コメント *", placeholder: "音と空気感が他にない" },
  ],
  EXPERIENCE: [
    { key: "name", label: "名前 / 場所", placeholder: "代々木公園エリアの散歩ルート" },
    { key: "feature", label: "何が特徴？", placeholder: "公園 → 古着屋 → コーヒー → 神社" },
    { key: "when", label: "いつ行った？", placeholder: "秋の平日昼" },
    { key: "audience", label: "誰向け？", placeholder: "観光客より地元寄りな人" },
    { key: "comment", label: "一言コメント *", placeholder: "1日かけてゆっくり歩くのに最適" },
  ],
  CRAFT: [
    { key: "name", label: "名前 / 場所", placeholder: "Collect Mills (岡山)" },
    { key: "feature", label: "何が特徴？", placeholder: "シャトル織機を残す数少ないデニム工場" },
    { key: "when", label: "いつ行った？", placeholder: "2026年3月、工場見学" },
    { key: "audience", label: "誰向け？", placeholder: "デニム好き、Made in Japan に興味のある人" },
    { key: "comment", label: "一言コメント *", placeholder: "三人の織り手のうち一人が引退する" },
  ],
  FAMILY: [
    { key: "name", label: "名前 / 場所", placeholder: "国営昭和記念公園 / 渋谷区立広尾図書館" },
    { key: "feature", label: "何が特徴？", placeholder: "ベビーカーOK、おむつ替え台あり、室内遊び場、芝生広場など" },
    { key: "ages", label: "想定する子供の年齢", placeholder: "0-3歳 / 未就学児 / 小学生" },
    { key: "audience", label: "誰向け？", placeholder: "週末の子連れお出かけ、雨の日の選択肢など" },
    { key: "comment", label: "一言コメント *", placeholder: "親の負担が少なく、子供が飽きずに過ごせた" },
  ],
};

/** Compose a structured memo string from form fields for the AI prompt. */
function composeMemo(pillar: Pillar, fields: PillarFields): string {
  const schema = PILLAR_FIELDS[pillar];
  const lines: string[] = [];
  lines.push(`[Editor's structured input — pillar: ${pillar}]`);
  for (const f of schema) {
    const v = fields[f.key]?.trim();
    if (v) lines.push(`- ${f.label.replace(/ \*$/, "")}: ${v}`);
  }
  return lines.join("\n");
}

export default function InputPage() {
  const [pillar, setPillar] = useState<Pillar | null>(null);
  const [fields, setFields] = useState<PillarFields>({});
  const [officialUrl, setOfficialUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [tabelogUrl, setTabelogUrl] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // === Translate (Ja → En) widget state ===
  // Self-contained so it doesn't tangle with the create-article form.
  const [trSlug, setTrSlug] = useState("");
  const [trBodyJa, setTrBodyJa] = useState("");
  const [trStatus, setTrStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [trBody, setTrBody] = useState("");
  const [trError, setTrError] = useState("");

  const submitTranslate = async () => {
    if (!trSlug.trim() || !trBodyJa.trim()) return;
    setTrStatus("sending");
    setTrError("");
    setTrBody("");
    try {
      const res = await fetch("/api/translate-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: trSlug.trim(), bodyJa: trBodyJa }),
      });
      const data = await res.json();
      if (data.success) {
        setTrStatus("done");
        setTrBody(data.body || "");
      } else {
        setTrStatus("error");
        setTrError(data.error || "Translation failed");
      }
    } catch (e: unknown) {
      setTrStatus("error");
      setTrError(e instanceof Error ? e.message : String(e));
    }
  };

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const comment = fields.comment?.trim() || "";
  const canSubmit = !!pillar && !!comment;

  const submit = async () => {
    if (!pillar || !comment) return;
    setStatus("sending");
    try {
      const base64Images: string[] = [];
      for (const f of images) {
        const b64 = await compressImage(f);
        base64Images.push(b64);
      }
      const memo = composeMemo(pillar, fields);
      const res = await fetch("/api/create-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo,
          pillar,
          images: base64Images,
          officialUrl: officialUrl.trim(),
          googleMapsUrl: googleMapsUrl.trim(),
          tabelogUrl: tabelogUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
        setResult(`📝 ${data.title}\n🇯🇵 ${data.titleJa || ""}\n\ntone-tokyo.com/article/${data.slug}`);
        setPillar(null);
        setFields({});
        setOfficialUrl("");
        setGoogleMapsUrl("");
        setTabelogUrl("");
        setImages([]);
        setPreviews([]);
      } else {
        setStatus("error");
        setResult(data.error || "Failed");
      }
    } catch (e: unknown) {
      setStatus("error");
      setResult(e instanceof Error ? e.message : String(e));
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: `1px solid ${C.lightWarm}`, borderRadius: 4,
    fontFamily: F.ui, fontSize: 14, background: "#fff", outline: "none", color: C.charcoal,
  };

  return (
    <div style={{ background: C.offWhite, minHeight: "100vh" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.lightWarm}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 18, color: C.charcoal, letterSpacing: "0.08em" }}>TONE <span style={{ fontWeight: 400, fontSize: 11, color: C.warmGray }}>TOKYO</span></span>
        </a>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray }}>Content Input</span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 700, color: C.charcoal, marginBottom: 8 }}>New Article</h1>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.warmGray, marginBottom: 8 }}>ピラーを選んで、わかる範囲で答えてください。AIが記事を生成します。</p>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray, marginBottom: 32, fontStyle: "italic" as const }}>※ 情報が少ない場合は短い記事 (200-300語) になります。AI が事実を創作することはありません。</p>

        {/* Pillar selector */}
        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 8, display: "block" }}>Pillar *</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8, marginBottom: 24 }}>
          {PILLARS.map((p) => {
            const selected = pillar === p.key;
            return (
              <button
                key={p.key}
                onClick={() => { setPillar(p.key); setFields({}); }}
                style={{
                  padding: "12px 8px",
                  border: `2px solid ${selected ? C.indigo : C.lightWarm}`,
                  background: selected ? C.indigo : "#fff",
                  color: selected ? "#fff" : C.charcoal,
                  borderRadius: 4,
                  fontFamily: F.ui,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{p.emoji}</div>
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Pillar-specific fields */}
        {pillar && (
          <div style={{ marginBottom: 8 }}>
            {PILLAR_FIELDS[pillar].map((f) => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.charcoal, marginBottom: 6, display: "block" }}>{f.label}</label>
                {f.key === "comment" || f.key === "ate" || f.key === "feature" ? (
                  <textarea
                    value={fields[f.key] || ""}
                    onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ""}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" as const }}
                  />
                ) : (
                  <input
                    type="text"
                    value={fields[f.key] || ""}
                    onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ""}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 8, display: "block" }}>🔗 Official Site URL（任意）</label>
        <input type="url" value={officialUrl} onChange={e => setOfficialUrl(e.target.value)} placeholder="https://example.com" style={{ ...inputStyle, marginBottom: 20 }} />

        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 8, display: "block" }}>📍 Google Maps URL（任意）</label>
        <input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/... or https://maps.app.goo.gl/..." style={{ ...inputStyle, marginBottom: 20 }} />

        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 8, display: "block" }}>🍽️ 食べログ URL（任意）</label>
        <input type="url" value={tabelogUrl} onChange={e => setTabelogUrl(e.target.value)} placeholder="https://tabelog.com/..." style={{ ...inputStyle, marginBottom: 20 }} />

        <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 8, display: "block" }}>📷 Photos / 写真（自動圧縮されます）</label>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => addImages(e.target.files)} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "16px", border: `2px dashed ${C.lightWarm}`, borderRadius: 4, background: "transparent", fontFamily: F.ui, fontSize: 14, color: C.warmGray, cursor: "pointer", marginBottom: 12 }}>+ タップして写真を追加</button>

        {previews.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: C.charcoal, color: "#fff", border: "none", fontSize: 11, cursor: "pointer", lineHeight: "20px" }}>×</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={submit} disabled={status === "sending" || !canSubmit} style={{ width: "100%", padding: "14px", background: status === "sending" ? C.warmGray : C.indigo, color: "#fff", border: "none", borderRadius: 4, fontFamily: F.ui, fontSize: 15, fontWeight: 600, letterSpacing: "0.06em", cursor: status === "sending" ? "wait" : "pointer", marginBottom: 20, opacity: canSubmit ? 1 : 0.5 }}>
          {status === "sending" ? "⏳ AI記事生成中..." : "記事を生成する"}
        </button>

        {status === "done" && (
          <div style={{ padding: 20, background: "#e8f5e9", borderRadius: 4, fontFamily: F.ui, fontSize: 14, color: "#2e7d32", whiteSpace: "pre-wrap" }}>✅ 記事が作成されました！{"\n\n"}{result}</div>
        )}
        {status === "error" && (
          <div style={{ padding: 20, background: "#fce4ec", borderRadius: 4, fontFamily: F.ui, fontSize: 14, color: "#c62828" }}>❌ エラー: {result}</div>
        )}

        <div style={{ marginTop: 40, padding: 24, background: C.cream, borderRadius: 4 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 12 }}>使い方</div>
          <div style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.8, color: C.charcoal }}>
            <p style={{ marginBottom: 8 }}>1. ピラーを選ぶ（FASHION / EAT / CULTURE / EXPERIENCE / CRAFT / FAMILY）</p>
            <p style={{ marginBottom: 8 }}>2. わかる範囲でフィールドを埋める（必須は「一言コメント」のみ）</p>
            <p style={{ marginBottom: 8 }}>3. 必要なら Google Maps / 食べログ URL を貼付（自動取得）</p>
            <p style={{ marginBottom: 8 }}>4. 写真を追加（複数可・自動圧縮）</p>
            <p style={{ marginBottom: 0 }}>5.「記事を生成する」→ AIが英語記事を作成 → Sanityに下書き保存</p>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.warmGray, lineHeight: 1.5, marginTop: 14, marginBottom: 0, fontStyle: "italic" as const }}>
            情報が薄い時は AI が無理に長文を書かず、200-300語の短い記事になります。AI は事実を創作しないので、知らないオーナー名や住所は省略されます。
          </p>
        </div>

        {/* === Translate Body (Ja → En) ===
            Operates on existing articles. Paste the article slug and the
            Japanese body, click "翻訳して更新" — the API translates with
            Claude in The Editor's voice and patches body + bodyJa in
            Sanity. */}
        <div style={{ marginTop: 32, padding: 24, background: "#fff", border: `1px solid ${C.lightWarm}`, borderRadius: 4 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.indigo, marginBottom: 4 }}>Translate Body (Ja → En)</div>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray, marginTop: 0, marginBottom: 16 }}>
            既存記事の <code>bodyJa</code>（日本語本文）を Editor のトーンで英訳し、Sanity の <code>body</code> を上書きします。
          </p>

          <label style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.charcoal, marginBottom: 6, display: "block" }}>Article Slug</label>
          <input
            type="text"
            value={trSlug}
            onChange={(e) => setTrSlug(e.target.value)}
            placeholder="okayama-selvedge-denim-weavers"
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <label style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.charcoal, marginBottom: 6, display: "block" }}>Body (日本語)</label>
          <textarea
            value={trBodyJa}
            onChange={(e) => setTrBodyJa(e.target.value)}
            placeholder="ここに日本語の記事本文を貼り付けてください..."
            rows={10}
            style={{ ...inputStyle, resize: "vertical" as const, marginBottom: 16, fontFamily: F.body, lineHeight: 1.6 }}
          />

          <button
            onClick={submitTranslate}
            disabled={trStatus === "sending" || !trSlug.trim() || !trBodyJa.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background: trStatus === "sending" ? C.warmGray : C.indigo,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontFamily: F.ui,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: trStatus === "sending" ? "wait" : "pointer",
              opacity: !trSlug.trim() || !trBodyJa.trim() ? 0.5 : 1,
            }}
          >
            {trStatus === "sending" ? "⏳ 翻訳中..." : "翻訳して更新"}
          </button>

          {trStatus === "done" && (
            <div style={{ marginTop: 16, padding: 16, background: "#e8f5e9", borderRadius: 4 }}>
              <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: "#2e7d32", marginBottom: 8 }}>
                ✅ Sanity の body を更新しました
              </div>
              <div style={{ fontFamily: F.body, fontSize: 13, color: C.charcoal, lineHeight: 1.6, whiteSpace: "pre-wrap" as const, maxHeight: 240, overflowY: "auto" as const }}>
                {trBody}
              </div>
            </div>
          )}
          {trStatus === "error" && (
            <div style={{ marginTop: 16, padding: 16, background: "#fce4ec", borderRadius: 4, fontFamily: F.ui, fontSize: 13, color: "#c62828" }}>
              ❌ {trError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
