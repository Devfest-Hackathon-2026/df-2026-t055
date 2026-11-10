---
type: Feature
title: 支援記録の保存と後入力
description: つまずき・対応・改善提案を記録し、記録入力と作業再開を切り離す。
authority: normative
status: stable
feature_id: support-records
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/7
  - https://github.com/Genk-AI/df-2026-t055/issues/8
  - https://github.com/Genk-AI/df-2026-t055/issues/26
  - https://github.com/Genk-AI/df-2026-t055/issues/45
  - https://github.com/Genk-AI/df-2026-t055/issues/67
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - packages/shared/src/support.ts
  - apps/web/src/support-record.tsx
tests:
  - tests/web-support-record.test.ts
  - tests/contract-support.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 現場の記録負担とブラウザでの保存失敗時の操作は未検証。
verification_scope: local-automated-tests
---

# 支援記録の保存と後入力

## 支援記録を次の版に使う

- 担当職員が対応を始めたときに、その職員用画面で記録欄を開く。「どこでつまずいたか」「何をしたか」「次回の改善提案」を分け、文字または確認・訂正した文字起こしで残す。「後で記録する」で閉じ、対応完了後も入力できる。記録の保存や生成完了を、対面支援や作業再開の条件にしない。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

現場の記録負担とブラウザでの保存失敗時の操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
