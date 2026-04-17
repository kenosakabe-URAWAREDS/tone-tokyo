# 保留タスク管理
最終更新: 2026-04-17（パート3完了時点）

## SKIP_LATER_001: B分類8箇所マーカー削除
- 状態: 保留
- 期限: Phase 1（2026-04-21）開始前
- 理由: 健太郎による差分リスト目視確認が未完のため
- 次アクション:
  1. 差分リストの完全版を別途出力・健太郎確認
  2. `scripts/remove-needs-verification.mjs` 作成
  3. dry-run → apply
- 影響範囲: 記事11本中8本（公開済含む）
- 優先度: 高
- 参考資料:
  - `docs/_needs_verification_diff.md` — path付き差分リスト（生成済）
  - `docs/_needs_verification_dump.txt` — マーカー前後300字コンテキストダンプ
  - `scripts/generate-b-diff.mjs` — 差分再生成スクリプト

## SKIP_LATER_002: C分類修正（Mitani / LYNARC）
- 状態: 保留
- 期限: 上記B分類と同時に処理
- 内容:
  - **Mitani Bettei記事** (`the-price-of-perfection-at-kioi-cho-mitani-bettei`):
    - `[NEEDS VERIFICATION]: per-person price and wine pairing cost` を削除（¥70,000 は事実確認済・そのまま）
    - `Fifteen pieces plus appetizers unfold over two hours` → `Twenty pieces plus appetizers unfold over two and a half hours`
    - `[NEEDS VERIFICATION]: course count and duration` を削除
  - **LYNARC記事** (`lynarc-s-hematine-infused-hair-care-creates-salon-results-at-home`):
    - 冒頭: `a private salon in Nakameguro, this premium hair care line channels over twenty years` → `HAIR SALON fil, a private salon in Nakameguro, this premium hair care line channels over fifteen years`
    - `[NEEDS VERIFICATION]: Nakameguro origin and 20+ year tenure claim` を削除
    - 中盤価格: `At ¥6,600 per bottle, LYNARC positions itself` → `Priced from ¥4,950 to ¥6,600 (approximately $33 to $44) across the lineup, LYNARC positions itself` **【健太郎承認済 ②案】**
    - 末尾: `LYNARC products are available online, with an introductory Total Care Set roughly half the price of the full lineup. [NEEDS VERIFICATION]: official URL, exact set price, regular price` → `LYNARC products are available online at lynarc-tokyo.com. The lineup includes the Maintenance Shampoo (¥6,050), Treatment (¥6,600), Body Wash (¥4,950), and Total Care 360 Oil (¥5,500).`
    - ⚠️ 冒頭の Maintenance Shampoo 描写部分の価格記述が存在するか要確認、あれば ¥6,050 に明記
- 優先度: 高

## DEADLINE_001: Phase 1 開始前までに必ず完了
- **期限: 2026-04-21 Phase 1 開始前**
- SKIP_LATER_001 と SKIP_LATER_002 の全マーカー除去＆事実修正
- パート3（Sanityスキーマ改修）で追加予定の `brandMentions` / `brandMentionLevel` フィールドを使った**個別記事末尾の Editor's Note disclosure**を、最低以下3記事に反映:
  - LYNARC記事 (`lynarc-s-hematine-infused-hair-care-creates-salon-results-at-home`) — The Editor is co-founder of LYNARC
  - THE BLUE STORE記事 (`the-blue-store-tokyo-s-most-understated-cool`) — The Editor is founder of THE BLUE STORE
  - Okayama Denim記事 (`okayama-selvedge-denim-weavers`) — mentions KURO (The Editor is founder of KURO)
- 各 disclosure は Editor's Note テンプレート（指示書 §1.7）に準拠

## SKIP_LATER_003: Sanity Organization を Blues Inc. → KAKEHASHI へ移管検討
- 状態: 保留
- 期限: Phase 1 成功後の議論
- 優先度: 中
- 現状:
  - Sanity プロジェクト (`w757ks40` / dataset `production`) は Blues Inc. の Sanity Organization 配下で作成されている
  - サイト運営主体は KAKEHASHI Inc. に移管済み（About/Footer/JSON-LD 全てに明記）
  - Sanity 組織の所属はコード/運営上の整合性と切り離されているため Phase 1 には影響しない
- 移管検討が必要になる条件:
  - 法務面で「データの所有主体」の明示的な整合が必要になったとき
  - KAKEHASHI Inc. 名義で Sanity のエンタープライズ契約に切替えるとき
  - Blues Inc. から Sanity 組織の権限・請求を切り離すとき
- 移管手順（参考）:
  - Sanity Studio の Manage (https://www.sanity.io/manage) から
  - プロジェクト → Settings → Transfer ownership
  - 移管先 Organization を新規作成（KAKEHASHI Inc.）
  - API トークン・メンバーシップを再設定
  - `.env.local` の `SANITY_*` 環境変数が変わる可能性あり

## 参考: 対象ブランドと関係性
- **The Editor が founder / co-founder:** KURO, VONN, THE BLUE STORE, AIZOME REWEAR, LYNARC, PRAS, INDIO & SELVEDGE, THE UNION
- **Blues Inc.（KAKEHASHI の姉妹会社）が日本国内代理店:** Rylee+Cru, Quincy Mae, Noralee
- 記事で言及があれば全ブランド一律 disclosure 対象

## 運用ルール

- 保留タスクを再開するときは、この `_pending_tasks.md` を最初に開き、
  次アクション手順どおりに進めること
- 完了したエントリは削除せず、状態を「完了」に変更して履歴として残す
- 新規保留タスクは `SKIP_LATER_NNN` のID形式で末尾に追記
- DEADLINE 付きタスクは冒頭（`DEADLINE_NNN`）に配置し、定期的に見直すこと
