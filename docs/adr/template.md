---
type: Template
title: ADRテンプレート
description: OKFのstatusを使って設計判断を記録するための雛形。
authority: reference
status: stable
---

# ADRテンプレート

以下を `docs/adr/NNNN-<短い英語名>.md` へコピーする。`NNNN` と題名を置き換え、[記録と更新の手順](../development/adr.md)に従って一覧へ追加する。

```markdown
---
type: Architecture Decision Record
title: ADR-NNNN 判断を表す短い題名
description: 判断の対象と選んだ方針を1文で記す。
authority: reference
status: draft
---

# ADR-NNNN：判断を表す短い題名

## 背景

解決する問題、制約、判断が必要になった理由。

## 比較した選択肢

選択肢ごとの利点・負担・採否の理由。現状維持も必要に応じて含める。

## 決定

採用・不採用・保留の判断と理由。判断前なら「検討中」と記す。
判断日・担当・レビュー状況は、確認できたものだけを書く。

## 影響

得られる効果、引き受ける負担、変更する仕様・実装、維持する条件。

## 根拠・関連仕様

正本、調査、Issue、PR、先行・後継ADRへのMarkdownリンク。
仕様変更がある場合は、同じPRで更新する正本を示す。

## 確認状況

確認したコード・仕様のSHA、検証結果、未確認事項。
設計の採用と実装完了・本人評価を区別する。
```
