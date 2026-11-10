---
type: Feature
title: 承認版の手作業による修正
description: 承認版を新しい下書きへコピーし、再解析なしで修正・再承認する。
authority: normative
status: stable
feature_id: manual-revision
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/25
  - https://github.com/Genk-AI/df-2026-t055/issues/53
  - https://github.com/Genk-AI/df-2026-t055/issues/57
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - apps/web/src/release-copy.ts
tests:
  - tests/api-manual-draft.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 実ブラウザでのコピーから再承認までの操作は未検証。
verification_scope: local-automated-tests
---

# 承認版の手作業による修正

1. 承認済みマニュアルの「コピーして直す」を押すと、その内容を新しい編集用下書きにコピーする。職員は文章や写真、表示方法を手作業で直し、プレビューと確認を経て新しい版を承認する。例えば「はしをそろえる」を「赤い線にあわせる」に直すために、動画解析をやり直す必要はない。新版の承認後、職員が次回の開始版に指定する。実行中の本人セッションは元の版を使い続ける。

## 承認版を手作業で直す

サーバーはコピー元の本人・作業・工程・写真・教え方・提示設定を新しい下書きへ引き継ぎ、確認チェックをすべてfalseにする。元の承認版とその写真は保持する。職員が手作業用の下書きを開くと、生成ジョブを作らずに編集画面を表示する。職員は初回生成と同じ操作で編集・照合・承認する。画面には「承認版のコピー」と表示し、生成待ちの表示やジョブのポーリングを行わない。コピーと手作業の修正は、動画解析の生成試行10回に数えない。

承認時にはコピー元の版IDを新しい版へ残す。元版で採用済みの支援記録は継承元をたどって確認し、手作業の下書きに新たな記録の採用IDを追加する操作は含めない。短文を直した工程の古い読み上げ音声は引き継がず、読み上げを使う場合は変更後の短文に対応する承認済み音声を用意する。本人が新しい内容を見るのは、新版の承認と割当を経て次回の作業を始めたときとする。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

実ブラウザでのコピーから再承認までの操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
