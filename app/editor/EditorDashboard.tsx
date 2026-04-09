'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { C, F } from './styles';

type Stockpile = {
  _id: string;
  memo?: string;
  receivedAt?: string;
  source?: string;
  thumb?: string;
  imageCount?: number;
};

type Article = {
  _id: string;
  title?: string;
  titleJa?: string;
  slug?: string;
  pillar?: string;
  thumb?: string;
  publishedAt?: string;
  _updatedAt?: string;
};

type ListResponse = {
  stockpiles: Stockpile[];
  drafts: Article[];
  published: Article[];
};

type Tab = 'stockpile' | 'drafts' | 'published';

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EditorDashboard() {
  const [tab, setTab] = useState<Tab>('stockpile');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/editor/list', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/editor';
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    await fetch('/api/editor/logout', { method: 'POST' });
    window.location.href = '/editor';
  };

  const tabBtn = (key: Tab, label: string, count: number) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          flex: 1,
          padding: '14px 8px',
          background: active ? C.indigo : 'transparent',
          color: active ? '#fff' : C.charcoal,
          border: 'none',
          borderBottom: active ? `2px solid ${C.indigo}` : `2px solid transparent`,
          fontFamily: F.ui,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.06em',
          cursor: 'pointer',
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 8,
            padding: '2px 8px',
            background: active ? 'rgba(255,255,255,0.18)' : C.cream,
            borderRadius: 10,
            fontSize: 11,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div style={{ background: C.offWhite, minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          background: '#fff',
          borderBottom: `1px solid ${C.lightWarm}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link href="/editor" style={{ textDecoration: 'none' }}>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 20,
              fontWeight: 700,
              color: C.charcoal,
            }}
          >
            TONE{' '}
            <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 400 }}>
              EDITOR
            </span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              fontFamily: F.ui,
              fontSize: 11,
              color: C.warmGray,
              textDecoration: 'none',
              letterSpacing: '0.08em',
            }}
          >
            ↗ Site
          </Link>
          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${C.lightWarm}`,
              borderRadius: 4,
              fontFamily: F.ui,
              fontSize: 11,
              color: C.charcoal,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          background: '#fff',
          borderBottom: `1px solid ${C.lightWarm}`,
        }}
      >
        {tabBtn('stockpile', 'ネタ帳', data?.stockpiles.length || 0)}
        {tabBtn('drafts', '下書き', data?.drafts.length || 0)}
        {tabBtn('published', '公開済', data?.published.length || 0)}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 60px' }}>
        {loading && (
          <div
            style={{
              fontFamily: F.ui,
              fontSize: 13,
              color: C.warmGray,
              textAlign: 'center',
              padding: '40px 0',
            }}
          >
            Loading...
          </div>
        )}
        {error && (
          <div
            style={{
              padding: 16,
              background: '#fce4ec',
              borderRadius: 4,
              fontFamily: F.ui,
              fontSize: 13,
              color: C.red,
              marginBottom: 16,
            }}
          >
            ❌ {error}
          </div>
        )}

        {!loading && data && (
          <>
            {tab === 'stockpile' && <StockpileList items={data.stockpiles} />}
            {tab === 'drafts' && (
              <ArticleList items={data.drafts} kind="draft" />
            )}
            {tab === 'published' && (
              <ArticleList items={data.published} kind="published" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StockpileList({ items }: { items: Stockpile[] }) {
  if (!items.length) {
    return (
      <Empty
        title="ネタ帳は空です"
        body="LINE で写真とメモを送ると、ここに溜まります。"
      />
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((s) => (
        <Link
          key={s._id}
          href={`/editor/stockpile/${s._id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              padding: 14,
              background: '#fff',
              border: `1px solid ${C.lightWarm}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                flexShrink: 0,
                background: C.cream,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {s.thumb ? (
                <img
                  src={`${s.thumb}?w=200&h=200&fit=crop&auto=format`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontFamily: F.ui,
                    fontSize: 11,
                    color: C.warmGray,
                  }}
                >
                  No photo
                </div>
              )}
              {s.imageCount && s.imageCount > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    fontFamily: F.ui,
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 8,
                  }}
                >
                  +{s.imageCount - 1}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: F.body,
                  fontSize: 14,
                  color: C.charcoal,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {s.memo || '(メモなし)'}
              </div>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 11,
                  color: C.warmGray,
                  marginTop: 8,
                }}
              >
                {fmtDateTime(s.receivedAt)}
                {s.source ? ` · ${s.source}` : ''}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ArticleList({
  items,
  kind,
}: {
  items: Article[];
  kind: 'draft' | 'published';
}) {
  if (!items.length) {
    return (
      <Empty
        title={kind === 'draft' ? '下書きはありません' : '公開記事はありません'}
        body={
          kind === 'draft'
            ? 'ネタ帳から記事を生成すると、ここに保存されます。'
            : '下書きを公開するとここに表示されます。'
        }
      />
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((a) => (
        <Link
          key={a._id}
          href={`/editor/article/${a._id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              padding: 14,
              background: '#fff',
              border: `1px solid ${C.lightWarm}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 96,
                height: 64,
                flexShrink: 0,
                background: C.cream,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {a.thumb && (
                <img
                  src={`${a.thumb}?w=240&h=160&fit=crop&auto=format`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: C.indigo,
                  marginBottom: 4,
                }}
              >
                {a.pillar}
              </div>
              <div
                style={{
                  fontFamily: F.display,
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.charcoal,
                  lineHeight: 1.3,
                  marginBottom: 4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {a.title || '(no title)'}
              </div>
              {a.titleJa && (
                <div
                  style={{
                    fontFamily: F.jp,
                    fontSize: 11,
                    color: C.warmGray,
                    marginBottom: 4,
                  }}
                >
                  {a.titleJa}
                </div>
              )}
              <div
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  color: C.warmGray,
                }}
              >
                {kind === 'published'
                  ? fmtDate(a.publishedAt)
                  : `Updated ${fmtDateTime(a._updatedAt)}`}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: '#fff',
        border: `1px dashed ${C.lightWarm}`,
        borderRadius: 6,
      }}
    >
      <div
        style={{
          fontFamily: F.display,
          fontSize: 18,
          color: C.charcoal,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray }}>
        {body}
      </div>
    </div>
  );
}
