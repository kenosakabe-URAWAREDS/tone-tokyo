'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { C, F } from './styles';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  status?: string;
  scheduledAt?: string;
};

type ListResponse = {
  stockpiles: Stockpile[];
  drafts: Article[];
  published: Article[];
};

type Photo = {
  _id: string;
  imageUrl?: string;
  takenAt?: string;
  placeName?: string;
  placeNameJa?: string;
  area?: string;
  groupId?: string;
  isRecommended?: boolean;
  uploadedAt?: string;
  assetRef?: string;
};

type PhotoGroup = {
  groupId: string;
  placeName?: string;
  area?: string;
  coverImageUrl?: string;
  photoCount: number;
  latestDate?: string;
};

type Tab = 'photos' | 'stockpile' | 'drafts' | 'published' | 'dashboard';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export default function EditorDashboard() {
  const [tab, setTab] = useState<Tab>('stockpile');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debug: confirm this version is running (remove later)
  useEffect(() => { console.log('[EditorDashboard] v2 — 5-tab build loaded'); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/editor/list', { cache: 'no-store' });
      if (res.status === 401) { window.location.href = '/editor'; return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const logout = async () => {
    await fetch('/api/editor/logout', { method: 'POST' });
    window.location.href = '/editor';
  };

  const tabBtn = (key: Tab, label: string, count?: number) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          flexShrink: 0,
          padding: '14px 12px',
          background: active ? C.indigo : 'transparent',
          color: active ? '#fff' : C.charcoal,
          border: 'none',
          borderBottom: active ? `2px solid ${C.indigo}` : `2px solid transparent`,
          fontFamily: F.ui,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {count != null && (
          <span style={{ marginLeft: 4, padding: '2px 6px', background: active ? 'rgba(255,255,255,0.18)' : C.cream, borderRadius: 10, fontSize: 10 }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div style={{ background: C.offWhite, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', background: '#fff', borderBottom: `1px solid ${C.lightWarm}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/editor" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.charcoal }}>
            TONE <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 400 }}>EDITOR</span>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, textDecoration: 'none', letterSpacing: '0.08em' }}>
            ↗ Site
          </Link>
          <button onClick={logout} style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${C.lightWarm}`, borderRadius: 4, fontFamily: F.ui, fontSize: 11, color: C.charcoal, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs — 5 tabs: 写真ライブラリ / ネタ帳 / 下書き / 公開済 / ダッシュボード */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: `1px solid ${C.lightWarm}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {tabBtn('photos', '写真ライブラリ')}
        {tabBtn('stockpile', 'ネタ帳', data?.stockpiles?.length ?? 0)}
        {tabBtn('drafts', '下書き', data?.drafts?.length ?? 0)}
        {tabBtn('published', '公開済', data?.published?.length ?? 0)}
        {tabBtn('dashboard', 'ダッシュボード')}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 60px' }}>
        {loading && tab !== 'photos' && tab !== 'dashboard' && (
          <div style={{ fontFamily: F.ui, fontSize: 13, color: C.warmGray, textAlign: 'center', padding: '40px 0' }}>Loading...</div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#fce4ec', borderRadius: 4, fontFamily: F.ui, fontSize: 13, color: C.red, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {tab === 'photos' && <PhotoLibrary />}
        {tab === 'stockpile' && !loading && data && <StockpileList items={data.stockpiles} />}
        {tab === 'drafts' && !loading && data && <ArticleList items={data.drafts} kind="draft" />}
        {tab === 'published' && !loading && data && <ArticleList items={data.published} kind="published" />}
        {tab === 'dashboard' && <DashboardPanel />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Photo Library Tab                                                  */
/* ================================================================== */

function PhotoLibrary() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [groups, setGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'groups'>('all');
  const [search, setSearch] = useState('');
  const [recommending, setRecommending] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/photos?${params.toString()}`);
      if (!res.ok) throw new Error('photos fetch failed');
      const data = await res.json();
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (e) {
      console.error('Failed to load photos:', e);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/photos/groups');
      if (!res.ok) throw new Error('groups fetch failed');
      const data = await res.json();
      setGroups(Array.isArray(data.groups) ? data.groups : []);
    } catch (e) {
      console.error('Failed to load groups:', e);
      setGroups([]);
    }
  }, []);

  // Load on mount. Search triggers via button/enter, not on every keystroke.
  useEffect(() => {
    loadPhotos();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = () => { loadPhotos(); };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 30) {
      alert('一度に最大30枚までアップロードできます');
      return;
    }
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadProgress(100);
      await loadPhotos();
      await loadGroups();
    } catch (e) {
      alert('アップロードに失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この写真を削除しますか？')) return;
    try {
      await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      setPhotos(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      alert('削除に失敗しました');
    }
  };

  const handleRecommend = async (groupId: string) => {
    setRecommending(groupId);
    try {
      const res = await fetch('/api/photos/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadPhotos();
    } catch (e) {
      alert('AI分析に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRecommending(null);
    }
  };

  return (
    <div>
      {/* Upload area */}
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} style={{ display: 'none' }} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          width: '100%', padding: 18,
          border: `2px dashed ${C.indigo}`,
          background: uploading ? C.cream : 'transparent',
          borderRadius: 6, fontFamily: F.ui, fontSize: 14, fontWeight: 600,
          color: C.indigo, cursor: uploading ? 'wait' : 'pointer', marginBottom: 16,
        }}
      >
        {uploading ? `アップロード中... ${uploadProgress}%` : '写真をアップロード'}
      </button>

      {uploading && (
        <div style={{ height: 4, background: C.lightWarm, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${uploadProgress}%`, background: C.indigo, transition: 'width 0.3s' }} />
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="店名・エリアで検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: `1px solid ${C.lightWarm}`, borderRadius: 4, fontFamily: F.ui, fontSize: 13, outline: 'none' }}
        />
        <button
          onClick={() => setViewMode(viewMode === 'all' ? 'groups' : 'all')}
          style={{ padding: '8px 14px', border: `1px solid ${C.lightWarm}`, borderRadius: 4, background: viewMode === 'groups' ? C.indigo : '#fff', color: viewMode === 'groups' ? '#fff' : C.charcoal, fontFamily: F.ui, fontSize: 12, cursor: 'pointer' }}
        >
          {viewMode === 'groups' ? 'グループ表示' : '全写真表示'}
        </button>
      </div>

      {loading ? (
        <div style={{ fontFamily: F.ui, fontSize: 13, color: C.warmGray, textAlign: 'center', padding: '40px 0' }}>読み込み中...</div>
      ) : viewMode === 'groups' ? (
        /* Group view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.length === 0 ? (
            <Empty title="グループなし" body="GPS情報のある写真をアップロードすると、自動でグルーピングされます。" />
          ) : groups.map(g => (
            <div key={g.groupId} style={{ display: 'flex', gap: 14, padding: 14, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6 }}>
              <div style={{ width: 84, height: 84, flexShrink: 0, background: C.cream, borderRadius: 4, overflow: 'hidden' }}>
                {g.coverImageUrl && <img src={`${g.coverImageUrl}?w=200&h=200&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: C.charcoal }}>{g.placeName || '(場所不明)'}</div>
                {g.area && <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>{g.area}</div>}
                <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 4 }}>
                  {g.photoCount}枚 · {fmtDate(g.latestDate)}
                </div>
                {g.photoCount >= 3 && (
                  <button
                    onClick={() => handleRecommend(g.groupId)}
                    disabled={recommending === g.groupId}
                    style={{ marginTop: 6, padding: '4px 10px', background: C.cream, border: `1px solid ${C.lightWarm}`, borderRadius: 4, fontFamily: F.ui, fontSize: 11, color: C.indigo, cursor: 'pointer' }}
                  >
                    {recommending === g.groupId ? 'AI分析中...' : '記事用おすすめ'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* All photos grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {photos.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <Empty title="写真がありません" body="上のボタンから写真をアップロードしてください。" />
            </div>
          ) : photos.map(p => (
            <div key={p._id} style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.lightWarm}`, background: '#fff' }}>
              <div style={{ aspectRatio: '1', background: C.cream }}>
                {p.imageUrl && <img src={`${p.imageUrl}?w=300&h=300&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              {p.isRecommended && (
                <div style={{ position: 'absolute', top: 4, left: 4, background: C.indigo, color: '#fff', fontFamily: F.ui, fontSize: 9, padding: '2px 6px', borderRadius: 8 }}>AI推薦</div>
              )}
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: C.charcoal, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.placeName || '場所不明'}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.warmGray }}>
                  {fmtDate(p.takenAt || p.uploadedAt)}
                </div>
                <button onClick={() => handleDelete(p._id)} style={{ marginTop: 4, padding: '2px 6px', background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 2, fontFamily: F.ui, fontSize: 9, color: C.red, cursor: 'pointer' }}>
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Dashboard Tab                                                      */
/* ================================================================== */

function DashboardPanel() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [nlLoading, setNlLoading] = useState(false);
  const [newsletter, setNewsletter] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setAnalytics(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setAnalytics({ error: true }); setLoading(false); } });
    return () => { cancelled = true; };
  }, [period]);

  const generateNewsletter = async () => {
    setNlLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      const data = await res.json();
      if (data.newsletter) setNewsletter(data.newsletter);
    } catch (e) {
      alert('ニュースレター生成に失敗しました');
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['7d', '30d', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '8px 16px', borderRadius: 4,
              border: `1px solid ${period === p ? C.indigo : C.lightWarm}`,
              background: period === p ? C.indigo : '#fff',
              color: period === p ? '#fff' : C.charcoal,
              fontFamily: F.ui, fontSize: 12, cursor: 'pointer',
            }}
          >
            {p === '7d' ? '7日間' : p === '30d' ? '30日間' : '全期間'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: F.ui, fontSize: 13, color: C.warmGray, textAlign: 'center', padding: '40px 0' }}>読み込み中...</div>
      ) : analytics?.error ? (
        <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, fontFamily: F.ui, fontSize: 13, color: C.warmGray }}>
          アナリティクスはまだ設定されていません。Supabase に page_views テーブルを作成してください。
        </div>
      ) : analytics ? (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            <StatCard label="総PV" value={analytics.totalPV?.toLocaleString() || '0'} />
            <StatCard label="NL登録" value={analytics.subscriberCount?.toLocaleString() || '0'} />
            <StatCard label="記事数" value={analytics.topArticles?.length?.toString() || '0'} />
          </div>

          {/* Daily PV chart (simple bar chart) */}
          {analytics.dailyPV?.length > 0 && (
            <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.indigo, marginBottom: 12 }}>Daily PV</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                {analytics.dailyPV.map((d: any, i: number) => {
                  const max = Math.max(...analytics.dailyPV.map((x: any) => x.count));
                  const h = max > 0 ? (d.count / max) * 80 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: '100%', height: h, background: C.indigo, borderRadius: '2px 2px 0 0', minHeight: 2 }} title={`${d.date}: ${d.count}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top articles */}
          {analytics.topArticles?.length > 0 && (
            <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.indigo, marginBottom: 12 }}>人気記事</div>
              {analytics.topArticles.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < analytics.topArticles.length - 1 ? `1px solid ${C.lightWarm}` : 'none' }}>
                  <span style={{ fontFamily: F.ui, fontSize: 13, color: C.charcoal }}>{i + 1}. {a.slug}</span>
                  <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.indigo }}>{a.count} PV</span>
                </div>
              ))}
            </div>
          )}

          {/* Pillar breakdown */}
          {analytics.pillarBreakdown?.length > 0 && (
            <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, marginBottom: 20 }}>
              <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.indigo, marginBottom: 12 }}>ピラー別PV</div>
              {analytics.pillarBreakdown.map((p: any) => {
                const pct = analytics.totalPV > 0 ? Math.round((p.count / analytics.totalPV) * 100) : 0;
                return (
                  <div key={p.pillar} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.ui, fontSize: 12, color: C.charcoal, marginBottom: 2 }}>
                      <span>{p.pillar}</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: C.lightWarm, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: C.indigo, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Newsletter section */}
      <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, marginTop: 20 }}>
        <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.indigo, marginBottom: 12 }}>ニュースレター</div>
        <button
          onClick={generateNewsletter}
          disabled={nlLoading}
          style={{ padding: '10px 20px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 4, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: nlLoading ? 'wait' : 'pointer', marginBottom: 12 }}
        >
          {nlLoading ? '生成中...' : '今週のニュースレターを生成'}
        </button>
        {newsletter && (
          <div style={{ marginTop: 12, padding: 16, background: C.cream, borderRadius: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>From the Editor</div>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.charcoal, lineHeight: 1.6 }}>{newsletter.personalNote}</p>
            {newsletter.topPicks?.map((pick: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderTop: `1px solid ${C.lightWarm}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.warmGray }}>{pick.pillar}</div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.charcoal }}>{pick.title}</div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray }}>{pick.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 16, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6, textAlign: 'center' }}>
      <div style={{ fontFamily: F.ui, fontSize: 24, fontWeight: 700, color: C.indigo }}>{value}</div>
      <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ================================================================== */
/*  Existing tabs (Stockpile / Article lists)                          */
/* ================================================================== */

function StockpileList({ items }: { items: Stockpile[] }) {
  if (!items.length) return <Empty title="ネタ帳は空です" body="LINE で写真とメモを送ると、ここに溜まります。" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((s) => (
        <Link key={s._id} href={`/editor/stockpile/${s._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', gap: 14, padding: 14, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6 }}>
            <div style={{ width: 84, height: 84, flexShrink: 0, background: C.cream, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              {s.thumb ? (
                <img src={`${s.thumb}?w=200&h=200&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontFamily: F.ui, fontSize: 11, color: C.warmGray }}>No photo</div>
              )}
              {s.imageCount && s.imageCount > 1 && (
                <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: F.ui, fontSize: 10, padding: '2px 6px', borderRadius: 8 }}>+{s.imageCount - 1}</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.body, fontSize: 14, color: C.charcoal, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {s.memo || '(メモなし)'}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 8 }}>
                {fmtDateTime(s.receivedAt)}{s.source ? ` · ${s.source}` : ''}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ArticleList({ items, kind }: { items: Article[]; kind: 'draft' | 'published' }) {
  if (!items.length) {
    return <Empty
      title={kind === 'draft' ? '下書きはありません' : '公開記事はありません'}
      body={kind === 'draft' ? 'ネタ帳から記事を生成すると、ここに保存されます。' : '下書きを公開するとここに表示されます。'}
    />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((a) => (
        <Link key={a._id} href={`/editor/article/${a._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', gap: 14, padding: 14, background: '#fff', border: `1px solid ${C.lightWarm}`, borderRadius: 6 }}>
            <div style={{ width: 96, height: 64, flexShrink: 0, background: C.cream, borderRadius: 4, overflow: 'hidden' }}>
              {a.thumb && <img src={`${a.thumb}?w=240&h=160&fit=crop&auto=format`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: F.ui, fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.indigo }}>{a.pillar}</span>
                {a.status === 'scheduled' && a.scheduledAt && (
                  <span style={{ fontFamily: F.ui, fontSize: 9, padding: '1px 6px', borderRadius: 8, background: '#FFF3E0', color: '#E65100' }}>
                    {fmtDateTime(a.scheduledAt)} 公開予定
                  </span>
                )}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, color: C.charcoal, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {a.title || '(no title)'}
              </div>
              {a.titleJa && <div style={{ fontFamily: F.jp, fontSize: 11, color: C.warmGray, marginBottom: 4 }}>{a.titleJa}</div>}
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.warmGray }}>
                {kind === 'published' ? fmtDate(a.publishedAt) : `Updated ${fmtDateTime(a._updatedAt)}`}
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
    <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', border: `1px dashed ${C.lightWarm}`, borderRadius: 6 }}>
      <div style={{ fontFamily: F.display, fontSize: 18, color: C.charcoal, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: F.body, fontSize: 13, color: C.warmGray }}>{body}</div>
    </div>
  );
}
