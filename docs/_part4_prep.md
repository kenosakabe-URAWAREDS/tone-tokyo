# パート4 着手準備メモ

作成日: 2026-04-17（パート3完了直後）
対応パート: パート4 /editor 統合管理画面化
着手予定: 2026-04-18 朝

---

## 1. 現状の /editor 構成（5タブ）

### エントリーポイント

| パス | 役割 |
|---|---|
| `app/editor/page.tsx` | ルート。未認証なら `<EditorLogin>`、認証済みなら `<EditorDashboard>` をレンダー |
| `app/editor/EditorLogin.tsx` | パスワード入力フォーム（POST `/api/editor/login`） |
| `app/editor/EditorDashboard.tsx` | 5タブ含む巨大ダッシュボード本体（約800行） |
| `app/editor/styles.ts` | 色・フォント・ボタンスタイル定数 |

### サブページ

| パス | 役割 |
|---|---|
| `app/editor/article/[id]/page.tsx` | 個別記事の編集サーバーコンポーネント（EditClient に委譲） |
| `app/editor/article/[id]/EditClient.tsx` | 個別記事編集 UI |
| `app/editor/stockpile/[id]/page.tsx` | ネタ帳ドキュメント詳細（AI生成遷移先） |
| `app/editor/stockpile/[id]/GenerateClient.tsx` | ネタ帳から記事を AI 生成する UI |
| `app/editor/about/page.tsx` | `/editor/about` — 技術スタック・データフロー説明ページ |
| `app/editor/about/AboutClient.tsx` | About の UI |

### 既存5タブ（`EditorDashboard.tsx` 内の `type Tab`）

```ts
type Tab = 'photos' | 'stockpile' | 'drafts' | 'published' | 'dashboard';
```

| key | ラベル | 実装関数 | 備考 |
|---|---|---|---|
| `photos` | 写真ライブラリ | `<PhotoLibrary />` (line 200以降) | Sanity `photo` ドキュメントのグリッド表示 |
| `stockpile` | ネタ帳 | `<StockpileList>` | LINE Bot / `/input` が保存した未処理ネタ一覧（デフォルトタブ） |
| `drafts` | 下書き | `<ArticleList kind="draft">` | `status == "draft"` な article |
| `published` | 公開済 | `<ArticleList kind="published">` | `status == "published"` / status未定義 |
| `dashboard` | ダッシュボード | `<DashboardPanel>` (line 548以降) | 統計・アクセス解析 |

デフォルト表示: `stockpile`（ネタ帳が最も頻度高のため）

### /editor 配下の API ルート（認証ゲート付き）

| パス | メソッド | 用途 |
|---|---|---|
| `/api/editor/login` | POST | パスワード検証・Cookie発行 |
| `/api/editor/logout` | POST | Cookie 破棄 |
| `/api/editor/list` | GET | stockpiles / drafts / published を一括取得 |
| `/api/editor/article/[id]` | GET | 個別記事 fetch |
| `/api/editor/update-article` | POST | 記事編集保存 |
| `/api/editor/publish-article` | POST | 記事を公開状態に切替 |
| `/api/editor/delete-article` | POST | 記事削除 |
| `/api/editor/stockpile/[id]` | GET | 個別ネタ帳 fetch |
| `/api/editor/generate-article` | POST | Claude で本文生成 |
| `/api/editor/translate-and-save` | POST | 日→英翻訳 + Sanity 保存 |
| `/api/editor/sanity-token` | GET | クライアントサイド用に write-token を返す（embedded Studio 用） |

認証ゲート: `proxy.ts` が `/editor/:path*` と `/api/editor/:path*` を matcher で保護。
`/editor` と `/api/editor/login` `/api/editor/logout` のみ例外。

---

## 2. 認証方式: `lib/editor-auth.ts` 維持確定

- HMAC-SHA256 Cookie 方式（現行堅牢）
- `EDITOR_PASSWORD` は `.env.local` 管理
- `timingSafeEqual` で比較、`httpOnly` + `sameSite: lax` + `secure: production`
- 24h maxAge セッション
- **パート4では認証ロジックに変更を加えない方針**（指示書§4-1 ケースB相当）

将来の複数ユーザー対応が必要になった場合は Supabase Auth への移行を検討（指示書§4-1 ケースA参照）。現状は単一パスワードで運用継続。

---

## 3. パート4 で追加すべき新3タブ

指示書§4-1 で定義された目標8タブ構成:

| # | key | ラベル | 区分 | 既存 EditorDashboard への影響 |
|---|---|---|---|---|
| 1 | `library` (既存 `photos`) | 写真ライブラリ | 既存 | key名を `photos` → `library` に揃える |
| 2 | `input` | **入力** 🆕 | 新規 | `/input` の機能をタブ内に移植 |
| 3 | `ideas` (既存 `stockpile`) | ネタ帳 | 既存 | key名を `stockpile` → `ideas` に揃える |
| 4 | `drafts` | 下書き | 既存 | 変更なし |
| 5 | `published` | 公開済 | 既存 | 変更なし |
| 6 | `generate` | **AI生成** 🆕 | 新規 | Claude 深掘り対話システム（パート5で本実装）のUIガラ |
| 7 | `precheck` | **公開前チェック** 🆕 | 新規 | AI臭さスコア / 禁止マーカー / disclosure チェック（パート6で本実装） |
| 8 | `dashboard` | ダッシュボード | 既存 | 変更なし |

### 新タブ 3つの概要

#### Tab 2: 入力（`input`）
- 現在独立ページの `/input` の機能をタブ内に移植
- 構成要素:
  - 写真アップロード（既存 /input の UI をコンポーネント化）
  - メモ入力
  - Google Maps / Tabelog / 公式 URL 入力
  - POST `/api/create-article` を叩いて Sanity に stockpile 相当を作成
- `/input` は永続的に `/editor?tab=input` へ 301 リダイレクト

#### Tab 6: AI生成（`generate`）
- ネタ帳のエントリから、AI 深掘り対話で記事を生成する新フロー（パート5本実装待ち）
- パート4 の範囲: UI ガラ・遷移動線・既存の `/api/editor/generate-article` へのプレースホルダ接続のみ
- 未着手のネタ帳一覧 → 選択 → 深掘り対話画面 → 草稿生成 → 下書き保存

#### Tab 7: 公開前チェック（`precheck`）
- draft 記事を全件スキャンして、公開前に必要なチェックを可視化
  - 禁止マーカー (`[NEEDS VERIFICATION]` 等) 残存チェック
  - Editorial 記事の語数 (< 800語で警告)
  - answerBlock / faqs 必須チェック
  - brandMentions vs brandMentionLevel の整合性
  - AI臭さスコア（パート6完了後に実質判定、パート4 では「未評価」表示）
  - disclosure 生成必要性
- 問題ある記事一覧を赤表示、ワンクリックで該当記事の編集ページへ遷移

---

## 4. パート4 の作業順序案（明日朝着手）

1. **`/editor` ルーティング刷新**: Query param `?tab=xxx` でタブ切替、`EditorDashboard.tsx` を 5タブ前提から 8タブ前提へ段階移行
2. **Tab 2「入力」実装**: `/input` の UI コード（`app/input/page.tsx`）を `<InputTab>` コンポーネントとして移植。`/input` から 301 リダイレクト設定
3. **Tab 7「公開前チェック」実装**: 新しい GROQ クエリで draft 記事の問題を可視化
4. **Tab 6「AI生成」実装（ガラのみ）**: 遷移動線と現状の `/api/editor/generate-article` への接続。深掘り対話の本実装はパート5
5. **既存タブ key 名統一**: `photos` → `library`、`stockpile` → `ideas`（外部から参照される場合は互換リダイレクト）
6. **動作確認 + 報告**

**作業時間見積: 4-5時間**（指示書§2の見積通り）

---

## 5. パート4 完了後の次パート

- **パート5（AI深掘り対話システム）**: Tab 6 の本実装。Claude Sonnet 4.5 を使った多段対話、健太郎さんの一次情報を構造化
- **パート6（AI臭さスコアリング）**: Tab 7 の本実装。6軸スコア（properNounDensity / specificNumbers / 等）を `aiGenerationScore` に書き込み

---

## 6. 明日朝のスタートアップチェックリスト

- [ ] `git pull`（念のため）
- [ ] `npm run dev` 起動、`/editor` がパスワード入力→ダッシュボードまで動くことを確認
- [ ] 本ドキュメント `docs/_part4_prep.md` を再読
- [ ] 指示書§4-1 パート4 セクション（`docs/2026-04-17_再構築実装指示書.md` 1099行目以降）を再読
- [ ] Claude Code にパート4 着手を指示
