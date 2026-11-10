---
type: Feature
title: 本人プロフィール
description: 本人の希望・観察・提案を分けて登録し、提示方法と配慮を見直す。
authority: normative
status: stable
feature_id: learner-profile
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/3
  - https://github.com/Genk-AI/df-2026-t055/issues/4
  - https://github.com/Genk-AI/df-2026-t055/issues/24
  - https://github.com/Genk-AI/df-2026-t055/issues/33
  - https://github.com/Genk-AI/df-2026-t055/issues/38
  - https://github.com/Genk-AI/df-2026-t055/issues/39
  - https://github.com/Genk-AI/df-2026-t055/issues/43
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - packages/shared/src/learner-profile.ts
  - apps/web/src/staff-learners.tsx
  - apps/web/src/learner-form.ts
tests:
  - tests/api-learner-profile.test.ts
  - tests/web-learner-profile.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 本人・現場での設定の確認と実端末操作は未検証。
verification_scope: local-automated-tests
---

# 本人プロフィール

**本人の登録と見直し。** `/staff/learners` で、本人の希望を確かめながら表示名、写真のみ／写真と短文、読み上げの希望、説明を受ける量や声かけ・待ち方などを登録・更新する。本人の希望、職員が観察した事実、職員の提案を分ける。未確認の項目は未確認のまま登録できる。

障害に関する情報は、支援に必要で本人が共有を希望する場合に限って職員が任意で記録する。確認元と確認日を残し、本人と見直しや削除ができるようにする。この項目から表示方法や権限を自動で決めない。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

本人・現場での設定の確認と実端末操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
