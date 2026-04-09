'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  C,
  F,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
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

type GalleryItem = { _key?: string; url: string; assetRef: string };

type Article = {
  _id: string;
  title?: string;
  titleJa?: string;
  slug?: string;
  pillar?: Pillar;
  subtitle?: string;
  body?: unknown;
  bodyJa?: string;
  status?: 'draft' | 'published';
  tags?: string[];
  readTime?: string;
  locationName?: string;
  locationNameJa?: string;
  address?: string;
  phone?: string;
  hours?: string;
  priceRange?: string;
  googleMapsUrl?: string;
  tabelogUrl?: string;
  websiteUrl?: string;
  officialUrl?: string;
  isJapaneseAbroad?: boolean;
  city?: string;
  country?: string;
  heroImage?: string;
  heroAssetRef?: string;
  gallery?: GalleryItem[];
  publishedAt?: string;
};

// Convert whatever shape the existing body might be in (string, PT
// array, custom block array) into a single plain-text string the
// editor can edit. \n\n separates paragraphs.
function bodyToText(body: unknown): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  const parts: string[] = [];
  for (const block of body as Array<Record<string, unknown>>) {
    if (block?._type === 'block') {
      const children = block.children as Array<{ text?: string }> | undefined;
      if (children) parts.push(children.map((c) => c?.text || '').join(''));
    } else if (typeof block?.text === 'string') {
      parts.push(block.text as string);
    }
  }
  return parts.filter(Boolean).join('\n\n');
}

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

export default function EditClient({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loadError, setLoadError] = useState('');

  // Editable copies
  const [title, setTitle] = useState('');
  const [titleJa, setTitleJa] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyJa, setBodyJa] = useState('');
  const [pillar, setPillar] = useState<Pillar>('EAT');
  const [tagsText, setTagsText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationNameJa, setLocationNameJa] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [tabelogUrl, setTabelogUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAbroad, setIsAbroad] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // Image state. `gallery` is the ordered list of images we'll
  // persist (existing + new). New ones get a base64 dataUrl in
  // `dataUrl`; persisted ones already have an assetRef.
  type EditableImage = {
    key: string;
    url: string;
    assetRef?: string;
    dataUrl?: string;
  };
  const [gallery, setGallery] = useState<EditableImage[]>([]);
  const [heroKey, setHeroKey] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/editor/article/${id}`, {
          cache: 'no-store',
        });
        if (res.status === 401) {
          window.location.href = '/editor';
          return;
        }
        const data: Article & { heroAssetRef?: string } = await res.json();
        if (!res.ok) throw new Error('Load failed');

        setArticle(data);
        setTitle(data.title || '');
        setTitleJa(data.titleJa || '');
        setSubtitle(data.subtitle || '');
        setBody(bodyToText(data.body));
        setBodyJa(data.bodyJa || '');
        setPillar((data.pillar as Pillar) || 'EAT');
        setTagsText((data.tags || []).join(', '));
        setLocationName(data.locationName || '');
        setLocationNameJa(data.locationNameJa || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setHours(data.hours || '');
        setPriceRange(data.priceRange || '');
        setGoogleMapsUrl(data.googleMapsUrl || '');
        setTabelogUrl(data.tabelogUrl || '');
        setWebsiteUrl(data.websiteUrl || data.officialUrl || '');
        setIsAbroad(Boolean(data.isJapaneseAbroad));
        setCity(data.city || '');
        setCountry(data.country || '');

        // Build the editable gallery: hero first, then gallery
        // entries. Both come from the API as image refs.
        const items: EditableImage[] = [];
        if (data.heroImage && data.heroAssetRef) {
          items.push({
            key: `hero-${data.heroAssetRef.slice(-6)}`,
            url: data.heroImage,
            assetRef: data.heroAssetRef,
          });
        }
        for (const g of data.gallery || []) {
          if (g.assetRef) {
            items.push({
              key: g._key || `g-${g.assetRef.slice(-6)}`,
              url: g.url,
              assetRef: g.assetRef,
            });
          }
        }
        setGallery(items);
        if (items[0]) setHeroKey(items[0].key);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [id]);

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const compressed: EditableImage[] = [];
    for (let i = 0; i < arr.length; i++) {
      const data = await compressImage(arr[i]);
      compressed.push({
        key: `new-${Date.now()}-${i}`,
        url: data,
        dataUrl: data,
      });
    }
    setGallery((prev) => {
      const next = [...prev, ...compressed];
      if (!heroKey && next[0]) setHeroKey(next[0].key);
      return next;
    });
  };

  const removeImage = (key: string) => {
    setGallery((prev) => {
      const next = prev.filter((g) => g.key !== key);
      if (heroKey === key && next[0]) setHeroKey(next[0].key);
      if (!next.length) setHeroKey('');
      return next;
    });
  };

  const moveImage = (key: string, dir: -1 | 1) => {
    setGallery((prev) => {
      const idx = prev.findIndex((g) => g.key === key);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const newImages: string[] = [];
      const galleryRefs: Array<{ assetRef: string }> = [];
      for (const g of gallery) {
        if (g.assetRef) {
          galleryRefs.push({ assetRef: g.assetRef });
        } else if (g.dataUrl) {
          newImages.push(g.dataUrl);
        }
      }

      // Hero by assetRef. New (base64-only) images won't have a ref
      // until upload completes server-side, so we send the original
      // hero key's assetRef when known.
      const heroEntry = gallery.find((g) => g.key === heroKey);
      const heroAssetRef = heroEntry?.assetRef;

      const res = await fetch('/api/editor/update-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title,
          titleJa,
          subtitle,
          body,
          bodyJa,
          pillar,
          tags: tagsText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          locationName,
          locationNameJa,
          address,
          phone,
          hours,
          priceRange,
          googleMapsUrl,
          tabelogUrl,
          websiteUrl,
          isJapaneseAbroad: isAbroad,
          city,
          country,
          gallery: galleryRefs,
          newImages,
          heroAssetRef,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');
      setStatusMsg({ kind: 'success', text: '✅ 保存しました' });
    } catch (e) {
      setStatusMsg({
        kind: 'error',
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    if (!article) return;
    const action = article.status === 'published' ? 'unpublish' : 'publish';
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/editor/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      setArticle({
        ...article,
        status: action === 'publish' ? 'published' : 'draft',
      });
      setStatusMsg({
        kind: 'success',
        text:
          action === 'publish'
            ? '✅ 公開しました'
            : '✅ 下書きに戻しました',
      });
    } catch (e) {
      setStatusMsg({
        kind: 'error',
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('この記事を削除しますか？元に戻せません。')) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/editor/delete-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');
      window.location.href = '/editor';
    } catch (e) {
      setBusy(false);
      setStatusMsg({
        kind: 'error',
        text: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (loadError) {
    return (
      <div style={{ padding: 24, fontFamily: F.ui, color: C.red }}>
        ❌ {loadError}
      </div>
    );
  }
  if (!article) {
    return (
      <div
        style={{ padding: 40, textAlign: 'center', fontFamily: F.ui, color: C.warmGray }}
      >
        Loading article...
      </div>
    );
  }

  const isPublished = article.status === 'published';

  return (
    <div style={{ background: C.offWhite, minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: '#fff',
          borderBottom: `1px solid ${C.lightWarm}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
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
            fontFamily: F.ui,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 12,
            color: '#fff',
            background: isPublished ? C.green : C.warmGray,
          }}
        >
          {isPublished ? 'Published' : 'Draft'}
        </div>
        {article.slug && (
          <Link
            href={`/article/${article.slug}`}
            target="_blank"
            style={{
              fontFamily: F.ui,
              fontSize: 11,
              color: C.indigo,
              textDecoration: 'none',
              marginLeft: 'auto',
            }}
          >
            ↗ Preview
          </Link>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px' }}>
        <SectionLabel>Title</SectionLabel>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...inputStyle, fontSize: 18, fontWeight: 600, marginBottom: 14 }}
        />

        <SectionLabel>Title (Japanese)</SectionLabel>
        <input
          type="text"
          value={titleJa}
          onChange={(e) => setTitleJa(e.target.value)}
          style={{ ...inputStyle, marginBottom: 14, fontFamily: F.jp }}
        />

        <SectionLabel>Subtitle</SectionLabel>
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={2}
          style={{ ...inputStyle, marginBottom: 14, resize: 'vertical' }}
        />

        <SectionLabel>Body (English) — 段落は空行で区切る</SectionLabel>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          style={{
            ...inputStyle,
            marginBottom: 14,
            resize: 'vertical',
            fontFamily: F.body,
            lineHeight: 1.7,
          }}
        />

        <SectionLabel>Body (Japanese) — 参考用</SectionLabel>
        <textarea
          value={bodyJa}
          onChange={(e) => setBodyJa(e.target.value)}
          rows={8}
          style={{
            ...inputStyle,
            marginBottom: 14,
            resize: 'vertical',
            fontFamily: F.jp,
            lineHeight: 1.7,
          }}
        />

        {/* Images */}
        <SectionLabel>Photos</SectionLabel>
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
            padding: 12,
            border: `2px dashed ${C.lightWarm}`,
            background: 'transparent',
            borderRadius: 4,
            fontFamily: F.ui,
            fontSize: 13,
            color: C.warmGray,
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          + 写真を追加
        </button>
        {gallery.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
              marginBottom: 18,
            }}
          >
            {gallery.map((g, i) => {
              const isHero = heroKey === g.key;
              const previewUrl = g.assetRef
                ? `${g.url}?w=400&h=300&fit=crop&auto=format`
                : g.url;
              return (
                <div
                  key={g.key}
                  style={{
                    position: 'relative',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: isHero
                      ? `2px solid ${C.indigo}`
                      : `1px solid ${C.lightWarm}`,
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '4/3',
                      background: C.cream,
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                  {isHero && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: C.indigo,
                        color: '#fff',
                        fontFamily: F.ui,
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        padding: '3px 7px',
                        borderRadius: 8,
                      }}
                    >
                      Hero
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      padding: 6,
                      background: '#fff',
                      borderTop: `1px solid ${C.lightWarm}`,
                    }}
                  >
                    {!isHero && (
                      <button
                        onClick={() => setHeroKey(g.key)}
                        style={iconBtnStyle}
                        title="Set as hero"
                      >
                        ★
                      </button>
                    )}
                    <button
                      onClick={() => moveImage(g.key, -1)}
                      disabled={i === 0}
                      style={iconBtnStyle}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveImage(g.key, 1)}
                      disabled={i === gallery.length - 1}
                      style={iconBtnStyle}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeImage(g.key)}
                      style={{ ...iconBtnStyle, color: C.red }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SectionLabel>Pillar</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
            gap: 8,
            marginBottom: 18,
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

        <SectionLabel>🌍 Japanese Abroad</SectionLabel>
        <div
          style={{
            padding: '12px 14px',
            background: isAbroad ? C.cream : 'transparent',
            border: `1px solid ${C.lightWarm}`,
            borderRadius: 4,
            marginBottom: 18,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={isAbroad}
              onChange={(e) => setIsAbroad(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: C.indigo }}
            />
            <span
              style={{
                fontFamily: F.ui,
                fontSize: 13,
                color: C.charcoal,
                fontWeight: 600,
              }}
            >
              海外シリーズ
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
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        <SectionLabel>Location</SectionLabel>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Name (English)"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <input
            type="text"
            value={locationNameJa}
            onChange={(e) => setLocationNameJa(e.target.value)}
            placeholder="店名 (日本語)"
            style={{ ...inputStyle, marginBottom: 12, fontFamily: F.jp }}
          />
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="住所 / Address"
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="電話番号"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <input
            type="text"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            placeholder="価格帯"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
        </div>
        <input
          type="text"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="営業時間"
          style={{ ...inputStyle, marginBottom: 18 }}
        />

        <SectionLabel>Links</SectionLabel>
        <input
          type="url"
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          placeholder="Google Maps URL"
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="Website URL"
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <input
          type="url"
          value={tabelogUrl}
          onChange={(e) => setTabelogUrl(e.target.value)}
          placeholder="食べログ URL"
          style={{ ...inputStyle, marginBottom: 18 }}
        />

        <SectionLabel>Tags (カンマ区切り)</SectionLabel>
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="ramen, sangenjaya, late night"
          style={{ ...inputStyle, marginBottom: 24 }}
        />

        {statusMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 4,
              fontFamily: F.ui,
              fontSize: 13,
              color: statusMsg.kind === 'error' ? C.red : C.green,
              background:
                statusMsg.kind === 'error' ? '#fce4ec' : '#e8f5e9',
              marginBottom: 14,
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <button
          onClick={save}
          disabled={busy}
          style={{ ...primaryButtonStyle(busy), marginBottom: 12 }}
        >
          {busy ? '⏳ 保存中...' : '保存'}
        </button>

        <button
          onClick={togglePublish}
          disabled={busy}
          style={{
            ...secondaryButtonStyle,
            width: '100%',
            padding: '14px',
            marginBottom: 12,
            background: isPublished ? '#fff' : C.green,
            color: isPublished ? C.indigo : '#fff',
            border: `1px solid ${isPublished ? C.indigo : C.green}`,
          }}
        >
          {isPublished ? '下書きに戻す' : '公開する'}
        </button>

        <button
          onClick={remove}
          disabled={busy}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: C.red,
            border: `1px solid ${C.red}`,
            borderRadius: 4,
            fontFamily: F.ui,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          削除
        </button>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 0',
  background: 'transparent',
  border: 'none',
  fontFamily: F.ui,
  fontSize: 13,
  color: C.charcoal,
  cursor: 'pointer',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
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
        marginTop: 4,
      }}
    >
      {children}
    </label>
  );
}
