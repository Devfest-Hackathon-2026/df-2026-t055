---
type: Documentation Policy
title: 文書の構造と更新手順
authority: policy
status: stable
sources:
  - id: okf-v0-2
    resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/0aa870cd87e97bfd9420fb99cc7400bba3f5822f/okf/SPEC.md
    title: Open Knowledge Format (OKF) Version 0.2（指定元の固定版）
  - id: okf-canonical-v0-2
    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md
    title: Open Knowledge Format (OKF) Version 0.2（移転先の固定版）
---

# 文書の構造と更新手順

実装の正本はdocs内の `authority: normative` を持つ文書群とする。入口は[索引](../index.md)、機能要件は[features](../features/index.md)、横断するデータ・API契約は[contracts](../contracts/index.md)に置く。Issue・PR・コードだけで仕様を上書きしない。仕様と実装が異なる場合は差分を記録して判断を求める。

## 参照版と適用範囲

文書再編の背景として[Google Cloudの記事](https://cloud.google.com/blog/ja/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing/)を参照した。形式の判定には、以下の版を固定した仕様を用いる。

**文書構造はOpen Knowledge Format（OKF）のVersion 0.2（参照表記：`okf@v0.2`）を参考にする。** 指定元の[knowledge-catalog/okf/SPEC.md](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/0aa870cd87e97bfd9420fb99cc7400bba3f5822f/okf/SPEC.md)を、確認日2026-11-10のコミット `0aa870cd87e97bfd9420fb99cc7400bba3f5822f` に固定して参照する。`okf@v0.2` は参照する仕様版の表記であり、Gitタグの存在を示すものではない。[^okf-v0-2]

旧リポジトリの[README](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/0aa870cd87e97bfd9420fb99cc7400bba3f5822f/okf/README.md)は仕様の移転と旧コピーの凍結を案内している。移転先は[open-knowledge-format](https://github.com/GoogleCloudPlatform/open-knowledge-format)であり、同日に確認した[移転先の固定版](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md)（`ad30107c31c06aec8a7d5636e0d1058118604e6f`）もVersion 0.2で、指定元の仕様本文と一致した。今後の更新は移転先で確認し、参照版を変える場合はこの記録と照合結果を更新する。[^okf-canonical-v0-2]

バンドルの範囲は `docs/` とし、1概念1Markdown、YAMLフロントマター、パスによる概念ID、Markdownリンク、`index.md` の段階的な参照、`log.md` の日付別履歴を採用する。ルートの `docs/index.md` に `okf_version: "0.2"` を宣言する。その他の索引にはフロントマターを置かない。構造の基本適合条件と確認範囲は[照合記録](../implementation-audits/20261110-1533-06c89d0.md)を参照する。[^okf-v0-2]

`authority`、`feature_id`、`scope`、`implementation`、`verification`、`verification_scope`、`assessed_commit`、`owner`、`issues`、`code`、`tests`、`evidence`、`gaps` は本プロジェクトの独自拡張。`verification: automated` は機能の記録済み検証範囲を表し、OKFの `verified` による文書の信頼区分とは別に扱う。`authority: normative` や `status: stable` だけで人による確認済み・実装完了と判定しない。

`docs:check` はこのリポジトリの編集規則の検査である。OKFでは任意の `title` 等やディレクトリ索引も、この検査では必須とし、リンク切れや不正な実装状態をエラーにする。任意項目の欠落・未知の型・リンク切れ等を許容するOKF汎用consumerの適合性検査としては使わない。OKFの基本構造への適合と、アプリの機能要件の実装・検証状況を分けて記録する。[^okf-v0-2]

[^okf-v0-2]: Open Knowledge Format Version 0.2、指定元の固定版。§2〜6・§8〜9・§11〜12。
[^okf-canonical-v0-2]: Open Knowledge Format Version 0.2、移転先の固定版。2026-11-10に指定元との本文一致を確認。

## 配置と権威

| authority | 用途 | 仕様を決めるか |
| --- | --- | --- |
| normative | product / features / contractsの共通契約 / architecture / validation / project / research/sources.md / developmentの採用済み規則 | 正本 |
| policy | 開発エージェントの作業ルール | 開発手順。機能要件の追加根拠にはしない |
| operational | デプロイと運用手順 | 採用要件を変更しない |
| reference | 調査資料 | 根拠と限界を読む。推奨だけで機能を採用しない |
| example | API例 | 正本と共有型の具体例 |
| evidence | 実装監査記録 | 検証範囲・未確認事項の証拠 |
| historical | archive | 当時の履歴。現行仕様に優先しない |
| navigation | 索引・移行表・Issue対応表 | 正本への入口 |

READMEは製品紹介のまま保つ。文書の実体はdocsへ集約し、ルートAGENTS.mdだけはdocs/AGENTS.mdへのシンボリックリンクで自動検出を保つ。LICENSE、実行時HTML、CI・ビルド設定、コード内fixtureは配布・実行用のファイルとして元の場所に置く。文書リンクはファイルからの相対パス、コード・テスト・証拠のメタデータはリポジトリルート基準とする。エージェントの作業ルールのコマンドもリポジトリルートから実行する。

## フロントマター

すべての概念文書に`type`・`title`・`authority`・`status`を置く。OKFの`status`は文書のライフサイクル（draft / stable / deprecated）で、実装状態とは別。

機能文書には`feature_id`・`scope`・`implementation`・`verification`・`assessed_commit`・`owner`・`issues`・`code`・`tests`・`evidence`・`gaps`を置く。パスから拡張子を除いたものがOKFの概念IDであり、`feature_id`は一覧・Issue対応用のプロジェクト内識別子とする。

| implementation | 意味 |
| --- | --- |
| unknown | 担当範囲の実装確認が未実施 |
| not_implemented | 必要な実装を対象コードで確認できない |
| partial | 一部実装。足りない処理や運用をgapsに記す |
| present | 対応コードあり。全受入条件の実装完了は未監査 |
| implemented | 全受入条件と実装を照合済み。証拠・未検証の条件を必ず記録 |

| verification | 意味 |
| --- | --- |
| unverified | この記録では検証していない |
| automated | 記載した自動テストの範囲で検証。実環境・実利用評価を含まない |
| manual | 記録した端末・参加者・条件で操作を確認。本人評価かチーム内操作かを証拠で区別 |

`assessed_commit`は確認対象のコードSHA。`verification_scope`は検証範囲で、初期移行の自動検証は`local-automated-tests`とする。`evidence`には実行コマンド・結果・版・制約を記録したdocs内のファイルを置く。コード・テストの存在だけでは`implemented`にしない。初期移行では過去の完了報告とIssueのcloseだけで完了を付けず、コードの存在確認と未確認条件を登録した。自動テストの通過で`implementation`を自動昇格させない。

## 一覧と検査

```sh
devenv shell -- npm run docs:list
devenv shell -- npm run docs:list -- --implementation not_implemented
devenv shell -- npm run docs:list -- --verification unverified
devenv shell -- npm run --silent docs:list -- --json
devenv shell -- npm run --silent docs:issues -- --json
devenv shell -- npm run docs:check
```

JSONをファイルへ渡す場合は、devenvの起動メッセージが混ざらないよう、シェル内で出力先を指定する。

```sh
devenv shell -- sh -c 'npm run --silent docs:list -- --json > /tmp/shigodeki-features.json'
```

listは機能文書を毎回読み、JSONに全件数・抽出件数・実装/検証ごとの件数と各機能のメタデータを返す。別の手書き進捗表や生成JSONへ実装状況を二重管理しない。issuesは機能文書のIssue参照を集約し、取得済み状態がある場合だけGitHub状態と取得時刻を添える。ネットワークアクセスやIssueの更新はしない。

checkはYAML・必須項目・列挙値・機能ID重複・コード/テスト/証拠の参照先・ローカルMarkdownリンクとアンカー・ルートの文書配置・各ディレクトリ索引を検査する。文書検査は要件の実装完了を判定しない。CIでも実行する。

## 変更時の手順

1. 索引と目的・安全条件、担当機能、共通契約、最新監査を読む。
2. Issueに機能仕様のパス、受入条件、担当、依存先を記す。旧Issueの節番号は[移行表](spec-migration.md)で読む。
3. 仕様変更は同じPRで対応する機能・共通契約を更新し、レビューを受ける。横断的な変更は関連する機能からリンクする。
4. 対応コード・テスト・確認SHA・証拠・残課題を更新する。本人への適合性や実GCP結合を、モック・チーム内操作と混同しない。
5. `docs:check`と変更に必要なテストを実行する。概念を追加・移動したら所属ディレクトリのindex.mdと参照先も更新する。
6. 監査と変更履歴を追記する。アーカイブと監査の当時の判断を現行の要件で上書きしない。
