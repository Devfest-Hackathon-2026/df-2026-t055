---
type: Feature
title: 認証・認可と下書きの配信境界
description: ロール・所属・本人・承認版を照合し、未承認内容を本人へ配信しない。
authority: normative
status: stable
feature_id: authentication
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/10
  - https://github.com/Genk-AI/df-2026-t055/issues/36
  - https://github.com/Genk-AI/df-2026-t055/issues/56
  - https://github.com/Genk-AI/df-2026-t055/issues/63
code:
  - apps/api/src/firebase-auth.ts
  - apps/api/src/app.ts
tests:
  - tests/firebase-auth.test.ts
  - tests/api-asset-authorization.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 実Firebaseアカウントと本番APIを通した権限境界の操作は未検証。
verification_scope: local-automated-tests
---

# 認証・認可と下書きの配信境界

## 本人へ下書きを漏らさない境界

本人ルーターは割当または本人のセッションからreleasesと承認済み資産を読む。draftsやgenerationJobsの取得ロジックを共用しない。releaseは職員の承認APIだけが作る。承認検査は全工程の照合、画像と代替テキストの確認、本人ID一致、空文なし、reviewFlagsへの職員の対応記録を必須にする。写真のみの版では、注意を本人が分かる形で伝えられることも確認する。

本人レスポンスは許可フィールドを明記した専用DTOから生成する。写真のみの版も代替テキストを返し、旧版で代替テキストがない場合は承認済みの工程文を使う。下書きID、AI候補、Storageパス、障害・特性の職員向け記録、職員メモや支援記録、修正履歴と参考メモを含めない。新人には承認された教え方を渡し、プロフィールの任意項目と生の支援記録、修正履歴と参考メモは返さない。本人からdraft APIを直接呼ぶと403。原動画・draft画像のassetIdを指定しても403。本人・職員のAPI応答は`Cache-Control: no-store`とし、サービスワーカーによる下書きキャッシュを作らない。承認版を見せる画面のラベルは「職員が確認した手順」とし、AI下書きのラベルと分ける。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

実Firebaseアカウントと本番APIを通した権限境界の操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
