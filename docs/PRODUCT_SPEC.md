---
type: Migration Map
title: 旧PRODUCT_SPECの節と移行先
authority: navigation
status: deprecated
---

# プロダクト仕様の移行案内

実装の正本はdocs内の `authority: normative` を持つ機能仕様・共通契約です。旧ファイル名と節アンカーを参照するIssueのために、この案内を残します。要件本文はここへ追記せず、[文書索引](index.md)から対応する仕様を更新してください。

## 0. 誰のための何を作るか（最新の決定・優先）

- [目的・対象者・安全条件](product/overview.md)

## 1. 今回作る範囲と主作業

- [MVPの範囲とデモ作業](product/demo-task.md)

## 2. 画面遷移と中核の操作

- [役割別の作業フロー](product/workflows.md)
- [本人プロフィール](features/learner-profile.md)
- [動画からの下書き生成](features/draft-generation.md)
- [照合・編集・承認・割当](features/draft-review.md)
- [承認版の手作業による修正](features/manual-revision.md)
- [手直し履歴とAI参考メモ](features/correction-history.md)
- [支援記録の保存と後入力](features/support-records.md)
- [支援記録から次回版を改善](features/guide-improvement.md)
- [本人の手順表示と即時停止](features/learner-session.md)
- [操作と状態のピクトグラム](features/pictogram-controls.md)
- [支援の担当・対応・再開通知](features/support-workflow.md)
- [新人への教え方の引き継ぎ](features/handover.md)

## 3. データ構造と状態遷移

- [保存データ・状態遷移・保管期限](contracts/data-model.md)
- [支援記録の音声入力](features/speech-input.md)

## 4. APIとGeminiの契約

- [HTTP APIの共通契約とエンドポイント](contracts/api.md)
- [動画からの下書き生成](features/draft-generation.md)
- [手直し履歴とAI参考メモ](features/correction-history.md)
- [支援の担当・対応・再開通知](features/support-workflow.md)
- [承認時の読み上げ音声生成](features/tts.md)
- [認証・認可と下書きの配信境界](features/authentication.md)

## 5. Google Cloud構成

- [Google Cloud実行基盤](features/cloud-platform.md)

## 6. 役割・結合点・日程

- [役割・結合点・日程](development/team.md)

## 7. 技術選定のpros / cons

- [技術選定と比較](architecture/decisions.md)

## 8. 検証とデモの合格条件

- [受入条件・比較検証・評価の記録](validation/acceptance.md)

## 9. 追加アイデアの「あれば枠」

- [追加機能の採用条件](product/optional.md)
- [承認時の読み上げ音声生成](features/tts.md)

## 10. 評価基準8項目との対応

- [評価基準との対応](validation/evaluation.md)

## 11. ハッカソン共通要件・提出条件（採択時の確認記録）

- [ハッカソンの提出条件と日程](project/submission.md)

## 12. 実装判断に使う出典・参考例

- [設計根拠と出典の使い方](research/sources.md)

## 13. 設計変更の反映状況

- [採用済み設計変更の履歴](development/decisions.md)

## 14. 更新の手順と履歴の扱い

- [仕様変更・レビュー・履歴の扱い](development/workflow.md)
