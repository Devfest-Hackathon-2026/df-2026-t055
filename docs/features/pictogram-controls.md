---
type: Feature
title: 操作と状態のピクトグラム
description: 絵・文字・形・配置を組み合わせて操作と支援・停止の状態を伝える。
authority: normative
status: stable
feature_id: pictogram-controls
scope: core
implementation: present
verification: automated
assessed_commit: ca5b71f936bc6ebde5fc7f5cd2ec36a3a1a802c3
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/6
  - https://github.com/Genk-AI/df-2026-t055/issues/66
  - https://github.com/Genk-AI/df-2026-t055/issues/82
code:
  - apps/web/src/main.tsx
  - apps/web/src/style.css
  - apps/web/src/learner-controls.ts
tests:
  - tests/web-learner-controls.test.ts
  - tests/web-learner-waiting.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
  - docs/implementation-audits/20261110-1523-e4196ca.md
gaps:
  - 絵の意味、拡大・支援技術、本人による操作の評価は未検証。
verification_scope: local-automated-tests
---

# 操作と状態のピクトグラム

## 操作と状態を伝えるピクトグラム

- 「手伝って」「やめる」を優先し、「はじめる」「もどる」「つぎへ」「つづける」「おわる」「おわります」と読み上げの再生にも、大きなピクトグラムと短い文字ラベルを添える。候補は助けを求める人、停止マーク、方向の矢印など。職員はボタンと押した後の結果を本人と確かめ、伝わりにくい場合は絵や提示方法を見直す。
- 同じ操作は画面間で形・配置をそろえ、「手伝って」と「やめる」は形でも区別できるようにする。支援送信中、職員の応答待ち、停止済み、送信に失敗して近くの職員を呼ぶ状態を、それぞれ文字と絵で伝える。画像の取得や音声の再生を待たずに操作できるようにする。
- 色、絵、文字、位置を組み合わせる。キーボード操作と見えるフォーカスを保ち、支援技術が読める操作名を付ける。文字と同じ意味の絵は重複して読み上げないようにする。使用する画像を固定し、端末や拡大表示で見え方を確かめ、出典とライセンスを記録する。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

絵の意味、拡大・支援技術、本人による操作の評価は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
