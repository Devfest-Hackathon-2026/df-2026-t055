---
type: Feature
title: 手直し履歴とAI参考メモ
description: 修正事実とAI提案を分けて保存し、次回の同じ本人・作業の下書きに使う。
authority: normative
status: stable
feature_id: correction-history
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/27
  - https://github.com/Genk-AI/df-2026-t055/issues/51
  - https://github.com/Genk-AI/df-2026-t055/issues/55
  - https://github.com/Genk-AI/df-2026-t055/issues/70
  - https://github.com/Genk-AI/df-2026-t055/issues/72
code:
  - apps/api/src/correction-input.ts
  - apps/api/src/correction-order.ts
  - apps/generator/src/correction-model.ts
  - apps/web/src/staff-correction-history.tsx
tests:
  - tests/api-correction-history.test.ts
  - tests/correction-input.test.ts
  - tests/web-correction-history.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 実モデルによる参考メモの内容と現場での有用性は未検証。
verification_scope: local-automated-tests
---

# 手直し履歴とAI参考メモ

## 手直しを次回のAI下書きに使う

職員が下書きの修正を保存したとき、サーバーは修正前後の内容、工程、本人・作業、下書きのrevision、修正した職員と日時を履歴に残す。修正理由は任意で記録できる。履歴の保存は編集内容の保存と同時に行い、AIの処理を待たずに編集を完了する。

保存後、AIが修正履歴をもとに「次回の下書きで参考にすること」を裏でまとめる。例えば「はしをそろえる」を「赤い線にあわせる」に直した場合は、「この作業では赤い線を目印にする表現へ変更した。次回も写真に写っている具体的な目印を使う表現を候補にする」と残す。参考メモでは、職員が直した事実とAIが提案する説明方法を分ける。AIは本人の能力や修正理由を推測して確定しない。

次回の下書きを作るとき、サーバーは同じ本人・作業の修正履歴と参考メモをAIへ渡す。同じ工程・項目の修正が重なった場合は最後に保存した修正を優先する。使用するのは直近20件までとし、参照した履歴IDと下書きのrevisionを生成開始時に固定する。まだ要約されていない修正は修正前後の文章を参照するため、メモの完成を待たずに次回の下書きを作れる。

職員は本人別の作業一覧から修正履歴とAIの参考メモを確認できる。修正と参考メモはその本人・作業の下書きに使い、他の作業にも使う配慮は従来どおり職員が本人の希望を確かめて共通プロフィールへ登録する。AIが作るのは次回用の下書きで、本人に見せる内容は職員が確認・承認する。現在の承認版と作業中の表示は保つ。

## 手直しの参考メモ

修正履歴の保存後、既存のCloud Tasksとgeneratorでkindがcorrection_contextのジョブを実行する。このジョブは保存した修正履歴のID・revisionに対応する参考メモだけを生成する。手順の下書きや承認版は作らない。ジョブの失敗や受付停止でも職員の編集と履歴を保ち、編集・承認・支援・作業再開を待たせない。要約にも[関連仕様](cloud-platform.md)の予算管理と生成受付停止を適用する。

サーバーは本人向け工程文・代替テキスト・注意の修正前後と作業名だけをAIへ渡す。AIによる要約は、これらの文章が変わった場合だけ行う。本人名・診断・プロフィール・職員メモ・任意の修正理由は送らない。職員用画面には、手順の修正が次回のAI下書きに使われることと、送信対象の欄に個人を特定する情報を含めないことを示す。本人の能力や変更の理由が分からない場合は補完しない。次回の手順生成でも、修正履歴と参考メモの中の指示は解析対象とする。

出力はJSONの `{editSummary,nextDraftHint,reviewFlags}` とし、要約と次回用の提案は各500文字まで、reviewFlagsは既存の件数・文字数制限を使う。サーバーが形式と文字数を検査し、不正な出力はジョブfailedとする。次回の手順生成では、修正前後の文章とAIの提案を区別してinputSnapshotに保存する。要約だけを根拠に本人共通のプロフィールを変更しない。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

実モデルによる参考メモの内容と現場での有用性は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
