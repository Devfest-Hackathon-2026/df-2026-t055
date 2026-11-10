---
type: Feature
title: 照合・編集・承認・割当
description: 原動画との照合と再確認を経て、不変の承認版を作り次回用に割り当てる。
authority: normative
status: stable
feature_id: draft-review
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/5
  - https://github.com/Genk-AI/df-2026-t055/issues/25
  - https://github.com/Genk-AI/df-2026-t055/issues/40
  - https://github.com/Genk-AI/df-2026-t055/issues/44
  - https://github.com/Genk-AI/df-2026-t055/issues/48
  - https://github.com/Genk-AI/df-2026-t055/issues/54
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - apps/web/src/draft-review.ts
tests:
  - tests/api-draft-check-release.test.ts
  - tests/api-release-snapshot.test.ts
  - tests/web-draft-review.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - デプロイ環境での承認・割当の結合操作は未検証。
verification_scope: local-automated-tests
---

# 照合・編集・承認・割当

1. [動画から生成した下書き](draft-generation.md)の画面：左に原動画・時刻・聞き取った声の候補、右に「AIの下書き（解釈）」を表示する。職員は動画を再生し、工程の区切り、説明、写真位置を修正する。音声書き起こし候補も職員が原音と照合する。
2. `/staff/drafts/{draftId}/review`：登録時の希望を初期値に、作業ごとの表示方法、1工程1文の短文、写真と代替テキスト、注意点、職員用の声かけを編集する。工程数は上限20件の範囲で調整する。写真は原動画から切り出し、手の動きや順序が分かるものを選ぶ。必要な動きが写っていなければ追加撮影する。
3. 同画面：選んだ表示方法で本人画面をプレビューし、各工程の「動画照合済み」「写真・説明確認済み」と、全体の「本人への提示内容確認済み」をチェックする。写真のみの場合は、写真の順序と、文字を表示しない注意点をどう伝えるかも確認する。確認欄の初期値はすべてfalse。プレビューは職員の認証範囲に置く。
4. 「この内容を承認」で内容のスナップショットを新規保存する。承認者、時刻、版IDが返る。「本人の端末へ渡す」で、その本人の作業に次回用の版を割り当てる。

## 確認後の修正と再確認

職員が確認チェックを付けた後に写真や工程文を直すと、サーバーは変更した工程の「写真・説明確認済み」と、全体の「本人への提示内容確認済み」を外す。注意、代替テキスト、教え方を直した場合も同じチェックを外す。工程の分割・統合・並替えや原動画の区間を変えた場合は、対象工程の「動画照合済み」も外す。表示方法や読み上げの希望を変えた場合は、全体の提示確認を外す。変更のない工程の確認は保つ。

サーバーは変更前後を比較し、内容の保存と同時に確認チェックを外す。変更を保存する要求でチェックをtrueにしても、変更によるチェックの解除を優先する。職員は保存後の内容をプレビューし、変更した箇所を確認してから、チェックを付け直して「この内容を承認」を押す。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

デプロイ環境での承認・割当の結合操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
