---
type: Specification
title: 採用済み設計変更の履歴
authority: normative
status: stable
---

# 採用済み設計変更の履歴

正本に反映した設計と、レビューを残している設計を記録する。実装状況は[受入条件](../validation/acceptance.md)の受入条件に対するテスト結果で確認する。

| PR | 提案 | 扱い |
| --- | --- | --- |
| [#7](https://github.com/Devfest-Hackathon-2026/df-2026-t055/pull/7) | [すべてのテキスト入力欄での音声入力](../archive/voice-input-accessibility-proposal.md) | 全画面への展開は別レビュー（本件では保留）。支援記録での音声入力の方式は [#22](https://github.com/Genk-AI/df-2026-t055/issues/22) で決定し、[第2〜4・8節](spec-migration.md)に反映。実装は #76 |
| [#8](https://github.com/Devfest-Hackathon-2026/df-2026-t055/pull/8) | [支援記録から非同期で手順を改善](../archive/support-feedback-improvement-proposal.md) | 職員の操作、記録と生成の契約、受入条件を[第2〜4・8節](spec-migration.md)に反映 |
| [#9](https://github.com/Devfest-Hackathon-2026/df-2026-t055/pull/9) | [本人向け操作のピクトグラム](../archive/pictogram-controls-proposal.md) | 操作・状態表示と本人による確認を[第2・8節](spec-migration.md)に反映 |
| [#176](https://github.com/Genk-AI/df-2026-t055/pull/176) | 本人・職員・新人画面のデザイン案（iPad横置き、状態表示のカード化、固定文言のルビ） | 本人画面の配置・状態表示の見せ方・固定文言のルビを[操作と状態のピクトグラム](../features/pictogram-controls.md)に反映。状態の判定と文言は既存のピクトグラムの要件（監査U07）に従う。本人ごとのルビ設定と写真サムネイル列は[設計根拠](../research/sources.md)のとおり未採用 |
| [#10](https://github.com/Devfest-Hackathon-2026/df-2026-t055/pull/10) | [本人プロフィール登録・写真のみの手順](../archive/learner-profile-photo-guidance-proposal.md) | 登録から提示・版固定までを[第1〜4・8節](spec-migration.md)に反映 |
| `codex/complete-notification`（PR番号未定） | 本人の作業完了を職員へ通知する | supportRequests に `kind: complete`（`open → acknowledged`）を追加し、完了イベントと同じトランザクションで作る。確認は停止通知と同じく同じ所属の職員が担当なしで行う。担当決定・開始・記録・再開は help 限定のまま。停止優先の規則は変えない。[支援フロー](../features/support-workflow.md)・[本人の手順表示](../features/learner-session.md)・[データ](../contracts/data-model.md)・[API](../contracts/api.md)・[受入条件](../validation/acceptance.md)に反映 |

なお、承認済み短文の **TTS事前生成** は既に設計フリーズ本文にあるP1の「あれば枠」。MVPの中核フローを妨げる場合は追加しない。
