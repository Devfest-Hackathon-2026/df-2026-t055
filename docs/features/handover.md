---
type: Feature
title: 新人への教え方の引き継ぎ
description: 承認済み手順と確認済みの声かけ・注意・完成基準を新人が参照する。
authority: normative
status: stable
feature_id: handover
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/12
  - https://github.com/Genk-AI/df-2026-t055/issues/80
  - https://github.com/Genk-AI/df-2026-t055/issues/83
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
tests:
  - tests/acceptance.test.ts
  - tests/api-asset-authorization.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 初見の担当者による引き継ぎ評価は未検証。
verification_scope: local-automated-tests
---

# 新人への教え方の引き継ぎ

## 新人：教え方を引き継ぐ

1. `/handover`へ新人権限でログインし、作業と本人の表示名を選ぶ。承認済み版の一覧が返る。
2. `/handover/releases/{releaseId}`で、本人に見せる手順、職員が確認した声かけ、待つ位置、注意の伝え方、完成基準、手本の該当区間を見る。写真のみの版も承認された説明・教え方を参照できる。画面には承認者と承認時刻を付ける。
3. 「引き継ぎを読んだ」を押して閲覧時刻を記録し、本人画面と並べて支援する。閲覧記録は理解度の点数に換算しない。新人権限には下書き閲覧・編集・承認を許可しない。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

初見の担当者による引き継ぎ評価は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
