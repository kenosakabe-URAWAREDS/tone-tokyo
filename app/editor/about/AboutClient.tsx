'use client';
import Link from 'next/link';
import { C, F } from '../styles';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const services: {
  name: string;
  role: string;
  cost: string;
  color: string;
}[] = [
  { name: 'Vercel', role: 'ホスティング / サーバーレスAPI / ビルド', cost: '$20/月', color: '#000' },
  { name: 'Cloudflare', role: 'DNS / CDN / SSL (tone-tokyo.com)', cost: '$10/年', color: '#F48120' },
  { name: 'Sanity', role: 'ヘッドレスCMS (記事・写真データ)', cost: '無料枠', color: '#F03E2F' },
  { name: 'Supabase', role: 'ニュースレター購読者DB', cost: '無料', color: '#3ECF8E' },
  { name: 'Claude API', role: 'AI記事生成 (claude-sonnet-4-20250514)', cost: '従量課金', color: '#D4A574' },
  { name: 'Webエディター', role: 'ブラウザ上の記事管理画面', cost: 'Vercelに含む', color: C.indigo },
  { name: 'LINE Bot', role: 'メッセージで記事投稿', cost: '無料', color: '#06C755' },
  { name: 'GitHub', role: 'ソースコード管理 / CI連携', cost: '無料', color: '#333' },
  { name: 'Claude Code', role: 'AIペアプログラミング / 開発全般', cost: 'Proに含む', color: '#D4A574' },
  { name: 'Next.js', role: 'Reactフレームワーク (v16 App Router)', cost: '無料 OSS', color: '#000' },
];

const flowSteps = [
  { icon: '1', label: '写真 + メモ', sub: 'Editor or LINE' },
  { icon: '2', label: 'Vercel API', sub: '受信 & 処理' },
  { icon: '3', label: 'Claude API', sub: '記事を自動生成' },
  { icon: '4', label: 'Sanity CMS', sub: '記事を保存' },
  { icon: '5', label: 'Vercel', sub: 'サイトに表示' },
  { icon: '6', label: 'Cloudflare', sub: 'tone-tokyo.com' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AboutClient() {
  return (
    <div style={{ background: C.offWhite, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', background: '#fff',
        borderBottom: `1px solid ${C.lightWarm}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/editor" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: C.charcoal }}>
            TONE <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 400 }}>EDITOR</span>
          </div>
        </Link>
        <Link href="/editor" style={{
          fontFamily: F.ui, fontSize: 12, color: C.indigo,
          textDecoration: 'none', letterSpacing: '0.06em',
        }}>
          ← ダッシュボードに戻る
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Title */}
        <h1 style={{
          fontFamily: F.display, fontSize: 28, fontWeight: 700,
          color: C.charcoal, margin: '0 0 8px',
        }}>
          Tech Stack
        </h1>
        <p style={{
          fontFamily: F.ui, fontSize: 13, color: C.warmGray,
          margin: '0 0 32px', letterSpacing: '0.04em',
        }}>
          TONE TOKYO を支える技術とサービスの全体像
        </p>

        {/* ── Data Flow ── */}
        <SectionTitle>データの流れ</SectionTitle>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 0,
          alignItems: 'center', marginBottom: 32,
        }}>
          {flowSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                background: '#fff', border: `1px solid ${C.lightWarm}`,
                borderRadius: 8, padding: '14px 16px', minWidth: 90,
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: F.ui, fontSize: 10, fontWeight: 700,
                  color: '#fff', background: C.indigo,
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.charcoal }}>
                  {step.label}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 11, color: C.warmGray, marginTop: 2 }}>
                  {step.sub}
                </div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{
                  fontFamily: F.ui, fontSize: 18, color: C.warmGray,
                  padding: '0 6px', flexShrink: 0,
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Services ── */}
        <SectionTitle>サービス構成</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12, marginBottom: 32,
        }}>
          {services.map((s) => (
            <div key={s.name} style={{
              background: '#fff', border: `1px solid ${C.lightWarm}`,
              borderRadius: 8, padding: '16px',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: C.charcoal, marginBottom: 4 }}>
                {s.name}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: C.warmGray, marginBottom: 10, lineHeight: 1.5 }}>
                {s.role}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 10px', borderRadius: 12,
                background: s.cost === '無料' || s.cost === '無料枠' || s.cost === '無料 OSS'
                  ? '#E8F5E9' : s.cost === '従量課金' ? '#FFF3E0' : C.cream,
                fontFamily: F.ui, fontSize: 11, fontWeight: 600,
                color: s.cost === '無料' || s.cost === '無料枠' || s.cost === '無料 OSS'
                  ? C.green : s.cost === '従量課金' ? '#E65100' : C.charcoal,
              }}>
                {s.cost}
              </div>
            </div>
          ))}
        </div>

        {/* ── Monthly Cost ── */}
        <SectionTitle>月額コスト概要</SectionTitle>
        <div style={{
          background: '#fff', border: `1px solid ${C.lightWarm}`,
          borderRadius: 8, padding: '24px', marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: C.charcoal }}>固定費 (Vercel Pro)</span>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.indigo }}>~$20</span>
          </div>
          <div style={{ height: 1, background: C.lightWarm, margin: '0 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: C.charcoal }}>従量課金込み (Claude API等)</span>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.indigo }}>~$30-50</span>
          </div>
          <div style={{ height: 1, background: C.lightWarm, margin: '0 0 16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: F.ui, fontSize: 14, color: C.charcoal }}>Cloudflare (年額)</span>
            <span style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.indigo }}>$10/年</span>
          </div>
          <div style={{
            marginTop: 20, padding: '12px 16px', background: C.cream,
            borderRadius: 6, fontFamily: F.ui, fontSize: 12,
            color: C.warmGray, lineHeight: 1.6,
          }}>
            Sanity, Supabase, LINE Bot, GitHub, Next.js は無料枠で運用。
            Claude Code は Anthropic Pro サブスクリプションに含まれる。
          </div>
        </div>

        {/* ── Architecture Note ── */}
        <SectionTitle>アーキテクチャ</SectionTitle>
        <div style={{
          background: '#fff', border: `1px solid ${C.lightWarm}`,
          borderRadius: 8, padding: '20px',
          fontFamily: F.ui, fontSize: 13, color: C.charcoal, lineHeight: 1.8,
        }}>
          <p style={{ margin: '0 0 12px' }}>
            <strong>Next.js 16 App Router</strong> + <strong>React 19</strong> + <strong>TypeScript</strong> + <strong>Tailwind v4</strong> で構築。
            サーバーコンポーネントでSanityからデータを取得し、クライアントコンポーネントでインタラクティブなUIを実現。
          </p>
          <p style={{ margin: '0 0 12px' }}>
            記事生成は <strong>Claude API (claude-sonnet-4-20250514)</strong> を使用。
            TONE TOKYO独自のエディターペルソナ（一人称・東京インサイダー視点）で自動執筆。
          </p>
          <p style={{ margin: 0 }}>
            写真はブラウザで圧縮後、<strong>Sanity Assets API</strong> に直接アップロード。
            Vercelのbodyサイズ制限を回避しつつ、EXIF情報から位置情報を自動抽出してグルーピング。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: F.ui, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: C.warmGray, marginBottom: 14,
      borderBottom: `1px solid ${C.lightWarm}`,
      paddingBottom: 8,
    }}>
      {children}
    </h2>
  );
}
