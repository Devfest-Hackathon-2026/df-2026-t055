---
type: Documentation Policy
title: ADRの記録と更新
authority: policy
status: stable
---

# ADRの記録と更新

ADR（Architecture Decision Record）は、設計上の選択とその理由を1件ずつ残す文書。[ADR一覧](../adr/index.md)から参照する。技術選定、共通契約、文書の構造など、後から判断の背景を確認したい変更を対象とする。

## 配置と書式

- `docs/adr/NNNN-<短い英語名>.md` に置き、番号は再利用しない。並行作業で重複した場合はマージ前に調整する。
- [テンプレート](../adr/template.md)をコピーし、`type: Architecture Decision Record`、`title`、`description`、`authority: reference`、`status` を記す。
- 本文に背景、比較した選択肢、決定、影響、根拠・関連仕様、確認状況を残す。採用・不採用・保留は「決定」に文章で記し、判断日・担当・レビュー状況を分かる範囲で添える。不明な情報を承認済みとして補わない。
- 仕様・コード・テスト・Issue・PR・後継ADRはMarkdownリンクで結ぶ。追加時はADRの `index.md` と文書の変更履歴も更新する。

## statusはOKFに統一する

`status` は[OKF v0.2の文書ライフサイクル](documentation.md#参照版と適用範囲)だけを表す。ADR専用の状態値や、同じ状態を二重管理するフィールドは追加しない。

| status | ADRでの意味 |
| --- | --- |
| `draft` | 記述・検討中の記録。未確認事項を本文に残す |
| `stable` | 記録として参照できる状態。採用・不採用・保留の区別は本文で確認する |
| `deprecated` | 後継の記録への移行などで、現行の判断としての参照を終了した状態。理由と後継へのリンクを残す |

`proposed`・`accepted`・`rejected`・`superseded` を `status` の値に使わない。不採用の判断も、現在参照すべき記録なら `stable` とできる。`stable` は人による承認済み・実装完了・テスト通過を意味しない。実装・検証状況は機能仕様と監査で確認する。

## 仕様と変更履歴の関係

ADRの `authority` は `reference` とし、要件の正本を増やさない。採用する仕様変更は、同じPRで対応する `authority: normative` の機能仕様・共通契約へ反映してレビューする。ADRの追加や `stable` への変更だけで、未採用の提案を要件として扱わない。

判断を置き換える場合は新しいADRを作り、旧ADRの本文を新しい結論で書き換えない。置換が採用された時点で旧ADRを `deprecated` にし、新旧を相互リンクする。後継の提案中は旧ADRの `status` を維持する。

既存の[技術選定と比較](../architecture/decisions.md)・[設計変更の履歴](decisions.md)は参照を保つ。過去の判断をADRへ記録するときは出典を示し、後から書いた理由と当時確認できる理由を区別する。

`devenv shell -- npm run docs:check` はADRにも共通のフロントマター・status列挙値・リンク・索引検査を適用する。通常のコミット前とCIでも同じ検査を行う。採否の妥当性やレビューの完了はこの検査では判定しない。
