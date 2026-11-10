---
type: Feature
title: 承認時の読み上げ音声生成
description: 承認する短文から事前生成した音声を、承認版の資産として配信する。
authority: normative
status: stable
feature_id: tts
scope: optional
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/16
  - https://github.com/Genk-AI/df-2026-t055/issues/31
  - https://github.com/Genk-AI/df-2026-t055/issues/73
code:
  - apps/api/src/tts.ts
  - apps/api/src/app.ts
tests:
  - tests/vertex-tts.test.ts
  - tests/api-approval-vertex-tts.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 実Vertex TTSの最新結合・発音・声・速度と本人の希望の評価は未検証。
verification_scope: local-automated-tests
---

# 承認時の読み上げ音声生成

読み上げ音声はVertex AIのGemini TTS（モデル例：`gemini-2.5-flash-tts`）で承認処理の一部として生成し、入力は承認済みの短文のみとする。未承認のテキストからは音声を生成しない。本人へ配信できるのは承認版に含まれる音声だけとする。使用モデルIDと単価は、AI担当が11/8午前に行うモデル決定に含める。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

実Vertex TTSの最新結合・発音・声・速度と本人の希望の評価は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
