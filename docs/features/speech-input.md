---
type: Feature
title: 支援記録の音声入力
description: 職員認証のAPIを介して文字起こしし、確認・訂正した文字だけを記録する。
authority: normative
status: stable
feature_id: speech-input
scope: core
implementation: not_implemented
verification: unverified
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/17
  - https://github.com/Genk-AI/df-2026-t055/issues/21
  - https://github.com/Genk-AI/df-2026-t055/issues/22
  - https://github.com/Genk-AI/df-2026-t055/issues/76
code: []
tests: []
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 文字起こしAPI・録音UI・Speech-to-Text接続の実装を対象コードで確認できない。採用済み方式と実装を区別する。
verification_scope: not-run
---

# 支援記録の音声入力

**支援記録の音声入力の方式（2026-11-09に [#22](https://github.com/Genk-AI/df-2026-t055/issues/22) で決定。実装は #76）。** 音声入力は支援記録フォームの3項目（`observedDifficulty` / `assistanceGiven` / `improvementSuggestion`）の入力時だけに提供し、担当者が claim → start → 対応 → acknowledge した後の記録入力時に使う。作業セッション中に常時聞き続ける用途には使わない。認識はGoogle Cloud Speech-to-Text V2（`chirp_3`・`ja-JP`）とし、ブラウザはCloud Runの`web-api`（職員認証）へ音声を送り、`web-api`からSpeech-to-Textへ渡して**文字起こしだけ**を返す。ブラウザからSpeech-to-Textへ直接送らず、ブラウザ内蔵のWeb Speech API（SpeechRecognition）は送信先・保存をアプリ側で制御できないため使わない。音声は`web-api`のメモリ上でのみ処理し、Storage・Firestore・ログへ保存しない。保存するのは職員が確認・訂正した文字だけで、既存の`PUT /support-requests/{id}/record`（`expectedRevision`競合検査つき）を使い、`supportRecords`のスキーマは変えない。Chirp 3は`us`/`eu`マルチリージョンのみのため、音声は東京リージョンでは処理しない。マイク許可の拒否・非対応・通信断・タイムアウト・認識失敗・キャンセルでも入力済みの文字を残し、再試行で既存の文字を上書きしない。費用はV2標準 $0.016/分（V2に無料枠なし、1秒単位の切り上げ）で、実装PRにモデルID・リージョン・単価・利用量の確認結果を残す。Speech Adaptation（用語のバイアシング）は今回の採用範囲外とし、デモ期間中に訂正負担を実測してから採否を判断する。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

文字起こしAPI・録音UI・Speech-to-Text接続の実装を対象コードで確認できない。採用済み方式と実装を区別する。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
