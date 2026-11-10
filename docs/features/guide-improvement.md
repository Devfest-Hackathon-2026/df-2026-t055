---
type: Feature
title: 支援記録から次回版を改善
description: 確認済みの要約と記録版を固定して改善下書きを作り、承認後に次回へ反映する。
authority: normative
status: stable
feature_id: guide-improvement
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/14
  - https://github.com/Genk-AI/df-2026-t055/issues/15
  - https://github.com/Genk-AI/df-2026-t055/issues/59
  - https://github.com/Genk-AI/df-2026-t055/issues/64
  - https://github.com/Genk-AI/df-2026-t055/issues/65
  - https://github.com/Genk-AI/df-2026-t055/issues/69
  - https://github.com/Genk-AI/df-2026-t055/issues/71
  - https://github.com/Genk-AI/df-2026-t055/issues/78
code:
  - apps/api/src/app.ts
  - apps/generator/src/worker.ts
  - packages/shared/src/work-guides.ts
  - apps/web/src/staff-work-guides.tsx
  - apps/web/src/staff-improvement-request.tsx
  - apps/web/src/improvement-review.tsx
tests:
  - tests/improvement-acceptance.test.ts
  - tests/api-work-guides.test.ts
  - tests/web-improvement-review.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 実GCP上の改善生成と、職員の総作業時間の評価は未検証。
verification_scope: local-automated-tests
---

# 支援記録から次回版を改善

- 本人別の作業一覧に、作業名、次回用の承認版、未反映の記録件数、生成・確認状態を表示する。職員が同じ本人・作業の記録を選び、「記録をもとに更新」で非同期生成を開始する。生成失敗時も記録と現在の割当を保ち、職員が再試行できる。
- 生成後は「職員の確認待ち」とし、変更前後、参照した記録、必要な原動画の区間を並べる。職員が修正し、反映した記録を明示して承認した後に、次回用の版として割り当てる。
- 他の作業にも使う説明方法は、本人の希望を確かめ、職員が共通プロフィールへ明示的に登録する。個別作業の記録はその作業の改善に使う。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

実GCP上の改善生成と、職員の総作業時間の評価は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
