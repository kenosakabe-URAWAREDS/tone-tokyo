'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  C,
  F,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
} from '../../styles';

type Pillar = 'FASHION' | 'EAT' | 'CULTURE' | 'EXPERIENCE' | 'CRAFT' | 'FAMILY';

const PILLARS: Pillar[] = [
  'FASHION',
  'EAT',
  'CULTURE',
  'EXPERIENCE',
  'CRAFT',
  'FAMILY',
];

type StockpileImage = { _key: string; url: string; assetRef: string };
type Stockpile = {
  _id: string;
  memo?: string;
  receivedAt?: string;
  source?: string;
  status?: string;
  googleMapsUrl?: string;
  tabelogUrl?: string;
  images?: StockpileImage[];
};

type Draft = {
  titleJa: string;
  subtitleJa: string;
  bodyJa: string;
  tags?: string[];
  readTime?: string;
  locationName?: string;
  locationNameJa?: string;
  address?: string;
  phone?: string;
  hours?: string;
  priceRange?: string;
  websiteUrl?: string;
  isJapaneseAbroad?: boolean;
  city?: string;
  country?: string;
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 1200;
      let w = img.width,
        h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        } else {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function GenerateClient({ id }: { id: string }) {
  const [stockpile, setStockpile] = useState<Stockpile | null>(null);
  const [loadError, setLoadError] = useState('');
  const [memo, setMemo] = useState('');
  const [pillar, setPillar] = useState<Pillar>('EAT');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tabelogUrl, setTabelogUrl] = useState('');
  const [isAbroad, setIsAbroad] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [extraImages, setExtraImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedSlug, setSavedSlug] = useState('');

  // Pull the stockpile so we can preview the photos and seed the
  // memo / URL fields.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/editor/stockpile/${id}`, {
          cache: 'no-store',
        });
        if (res.status === 401) {
          window.location.href = '/editor';
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Load failed');
        setStockpile(data);
        setMemo(data.memo || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
        setTabelogUrl(data.tabelogUrl || '');
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [id]);

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const compressed: string[] = [];
    for (const f of arr) {
      compressed.push(await compressImage(f));
    }
    setExtraImages((prev) => [...prev, ...compressed]);
  };

  const removeExtraImage = (i: number) => {
    setExtraImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const generate = async () => {
    setGenerating(true);
    setGenError('');
    setDraft(null);
    try {
      const res = await fetch('/api/editor/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockpileId: id,
          memo,
          additionalImages: extraImages,
          googleMapsUrl: googleMapsUrl.trim(),
          tabelogUrl: tabelogUrl.trim(),
          pillar,
          isJapaneseAbroad: isAbroad,
          city: isAbroad ? city.trim() : '',
          country: isAbroad ? country.trim() : '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      setDraft(data.draft);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  };

  const updateDraft = (patch: Partial<Draft>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const translateAndSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/editor/translate-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockpileId: id,
          jaTitle: draft.titleJa,
          jaSubtitle: draft.subtitleJa,
          jaBody: draft.bodyJa,
          tags: draft.tags || [],
          readTime: draft.readTime || '',
          locationName: draft.locationName || '',
          locationNameJa: draft.locationNameJa || '',
          pillar,
          address: draft.address || '',
          phone: draft.phone || '',
          hours: draft.hours || '',
          priceRange: draft.priceRange || '',
          googleMapsUrl: googleMapsUrl.trim(),
          tabelogUrl: tabelogUrl.trim(),
          websiteUrl: draft.websiteUrl || '',
          isJapaneseAbroad: isAbroad,
          city: isAbroad ? city.trim() : '',
          country: isAbroad ? country.trim() : '',
          additionalImages: extraImages,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');
      setSavedSlug(data.slug);
      // Take the user back to the dashboard so they can see the new
      // draft in the Drafts tab.
      setTimeout(() => {
        window.location.href = '/editor';
      }, 800);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: C.offWhite, minHeight: '100vh', paddingBottom: 80 }}>
      <Header title="記事を生成" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {loadError && (
          <Banner kind="error" text={loadError} />
        )}
        {!stockpile && !loadError && (
          <div style={{ padding: 40, textAlign: 'center', color: C.warmGray }}>
            Loading stockpile...
          </div>
        )}

        {stockpile && (
          <>
            <Section label="MEMO (編集可)">
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: F.body }}
              />
            </Section>

            <Section label="ネタ帳の写真">
              {stockpile.images && stockpile.images.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 8,
                  }}
                >
                  {stockpile.images.map((img) => (
                    <div
                      key={img._key}
                      style={{
                        aspectRatio: '1',
                        background: C.cream,
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={`${img.url}?w=400&h=400&fit=crop&auto=format`}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: F.ui,
                    fontSize: 12,
                    color: C.warmGray,
                    padding: '8px 0',
                  }}
                >
                  写真なし
                </div>
              )}
            </Section>

            <Section label="追加の写真 (任意)">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addImages(e.target.files)}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%',
                  padding: 14,
                  border: `2px dashed ${C.lightWarm}`,
                  background: 'transparent',
                  borderRadius: 4,
                  fontFamily: F.ui,
                  fontSize: 13,
                  color: C.warmGray,
                  cursor: 'pointer',
                }}
              >
                + 写真を追加
              </button>
              {extraImages.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {extraImages.map((src, i) => (
                    <div
                      key={i}
                      style={{ position: 'relative', width: 80, height: 80 }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <button
                        onClick={() => removeExtraImage(i)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: C.charcoal,
                          color: '#fff',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section label="Google Maps URL">
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                style={inputStyle}
              />
            </Section>

            <Section label="食べログ URL">
              <input
                type="url"
                value={tabelogUrl}
                onChange={(e) => setTabelogUrl(e.target.value)}
                placeholder="https://tabelog.com/..."
                style={inputStyle}
              />
            </Section>

            <Section label="Pillar">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
                  gap: 8,
                }}
              >
                {PILLARS.map((p) => {
                  const sel = pillar === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPillar(p)}
                      style={{
                        padding: '10px 4px',
                        background: sel ? C.indigo : '#fff',
                        color: sel ? '#fff' : C.charcoal,
                        border: `2px solid ${sel ? C.indigo : C.lightWarm}`,
                        borderRadius: 4,
                        fontFamily: F.ui,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section label="">
              <div
                style={{
                  padding: '12px 14px',
                  background: isAbroad ? C.cream : 'transparent',
                  border: `1px solid ${C.lightWarm}`,
                  borderRadius: 4,
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAbroad}
                    onChange={(e) => setIsAbroad(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: C.indigo,
                      cursor: 'pointer',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: F.ui,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.charcoal,
                    }}
                  >
                    🌍 Japanese Abroad シリーズ
                  </span>
                </label>
                {isAbroad && (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                    }}
                  >
                    <div>
                      <label style={labelStyle}>City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="London"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="UK"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Section>

            <button
              onClick={generate}
              disabled={generating}
              style={{ ...primaryButtonStyle(generating), marginTop: 16 }}
            >
              {generating ? '⏳ 日本語ドラフト生成中...' : '記事を生成'}
            </button>
            {genError && <Banner kind="error" text={genError} />}

            {draft && (
              <div
                style={{
                  marginTop: 28,
                  padding: 20,
                  background: '#fff',
                  border: `1px solid ${C.lightWarm}`,
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: F.ui,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.indigo,
                    marginBottom: 16,
                  }}
                >
                  日本語ドラフト (確認・修正)
                </div>

                <DraftField
                  label="日本語タイトル"
                  value={draft.titleJa}
                  onChange={(v) => updateDraft({ titleJa: v })}
                />
                <DraftField
                  label="日本語サブタイトル"
                  value={draft.subtitleJa}
                  onChange={(v) => updateDraft({ subtitleJa: v })}
                />
                <DraftField
                  label="日本語本文"
                  value={draft.bodyJa}
                  onChange={(v) => updateDraft({ bodyJa: v })}
                  textarea
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <DraftField
                    label="店名 (英)"
                    value={draft.locationName || ''}
                    onChange={(v) => updateDraft({ locationName: v })}
                  />
                  <DraftField
                    label="店名 (日)"
                    value={draft.locationNameJa || ''}
                    onChange={(v) => updateDraft({ locationNameJa: v })}
                  />
                </div>

                <DraftField
                  label="住所"
                  value={draft.address || ''}
                  onChange={(v) => updateDraft({ address: v })}
                />
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <DraftField
                    label="電話番号"
                    value={draft.phone || ''}
                    onChange={(v) => updateDraft({ phone: v })}
                  />
                  <DraftField
                    label="価格帯"
                    value={draft.priceRange || ''}
                    onChange={(v) => updateDraft({ priceRange: v })}
                  />
                </div>
                <DraftField
                  label="営業時間"
                  value={draft.hours || ''}
                  onChange={(v) => updateDraft({ hours: v })}
                />
                <DraftField
                  label="Website URL"
                  value={draft.websiteUrl || ''}
                  onChange={(v) => updateDraft({ websiteUrl: v })}
                />
                <DraftField
                  label="タグ (カンマ区切り)"
                  value={(draft.tags || []).join(', ')}
                  onChange={(v) =>
                    updateDraft({
                      tags: v
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />

                <button
                  onClick={translateAndSave}
                  disabled={saving}
                  style={{ ...primaryButtonStyle(saving), marginTop: 16 }}
                >
                  {saving
                    ? '⏳ 英訳して保存中...'
                    : '英語に変換して保存 → 下書き'}
                </button>
                {saveError && <Banner kind="error" text={saveError} />}
                {savedSlug && (
                  <Banner
                    kind="success"
                    text={`✅ 下書きを保存しました (slug: ${savedSlug})。ダッシュボードに戻ります...`}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: '14px 20px',
        background: '#fff',
        borderBottom: `1px solid ${C.lightWarm}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Link
        href="/editor"
        style={{
          fontFamily: F.ui,
          fontSize: 12,
          color: C.indigo,
          textDecoration: 'none',
        }}
      >
        ← Back
      </Link>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 16,
          fontWeight: 700,
          color: C.charcoal,
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            fontFamily: F.ui,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.indigo,
            display: 'block',
            marginBottom: 8,
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function DraftField({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: F.body,
            lineHeight: 1.7,
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );
}

function Banner({
  kind,
  text,
}: {
  kind: 'error' | 'success';
  text: string;
}) {
  const isErr = kind === 'error';
  return (
    <div
      style={{
        marginTop: 14,
        padding: '12px 14px',
        background: isErr ? '#fce4ec' : '#e8f5e9',
        borderRadius: 4,
        fontFamily: F.ui,
        fontSize: 13,
        color: isErr ? C.red : C.green,
        whiteSpace: 'pre-wrap',
      }}
    >
      {isErr ? '❌ ' : ''}
      {text}
    </div>
  );
}
