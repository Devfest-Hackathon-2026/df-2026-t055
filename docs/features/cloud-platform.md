---
type: Feature
title: Google Cloud実行基盤
description: Cloud Run・Tasks・Firestore・StorageとIAM・予算・保管期限を組み合わせる。
authority: normative
status: stable
feature_id: cloud-platform
scope: core
implementation: partial
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/10
  - https://github.com/Genk-AI/df-2026-t055/issues/11
  - https://github.com/Genk-AI/df-2026-t055/issues/28
  - https://github.com/Genk-AI/df-2026-t055/issues/29
  - https://github.com/Genk-AI/df-2026-t055/issues/30
  - https://github.com/Genk-AI/df-2026-t055/issues/47
  - https://github.com/Genk-AI/df-2026-t055/issues/50
  - https://github.com/Genk-AI/df-2026-t055/issues/68
  - https://github.com/Genk-AI/df-2026-t055/issues/77
code:
  - apps/api/src/server.ts
  - apps/api/src/cloud-tasks.ts
  - apps/api/src/firestore-repository.ts
  - apps/api/src/cloud-storage.ts
  - apps/generator/src/server.ts
tests:
  - tests/production-api-startup.test.ts
  - tests/cloud-tasks.test.ts
  - tests/firestore-repository.test.ts
  - tests/cloud-storage.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - 接続アダプタと起動検査はあるが、本番配置・IAM・費用・期限削除の実運用確認は未完了。
verification_scope: local-automated-tests
---

# Google Cloud実行基盤

ブラウザ → Cloud Run `web-api` → Firestore／Cloud Storage、生成要求 → Cloud Tasks → 非公開Cloud Run `generator` → Vertex AI、という構成にする。

- フロントはReact＋TypeScript＋Vite。`web-api`はNode.js＋TypeScriptでAPIとビルド済み画面を同一オリジン配信する。`generator`もTypeScriptを使い、動画解析ジョブと候補写真の切り出しを担当する。両コンテナにffmpegを含め、職員が指定した時刻の写真の再切り出しは`web-api`で同期実行する。
- Firebase Authenticationで事前登録したデモ用アカウントを認証する。職員が作る本人プロフィールは管理用スクリプトで本人アカウントとひも付ける。職員・本人・新人の権限はサーバーで検査する。
- Cloud Runは2サービス。`web-api`は公開HTTPSリクエストを受け付け、`generator`は認証付きの内部処理。生成はCloud TasksのHTTP呼出し内で完了させ、ブラウザ切断と切り離す。応答後のバックグラウンド処理に依存しない。[Cloud Runの実行契約](https://cloud.google.com/run/docs/container-contract)
- Cloud Tasksは生成キューを並列1に制限し、生成タイムアウトを240秒、Cloud Run側を300秒にする。タスク再配送とジョブのリース・冪等処理を組み合わせる。
- Firestoreは手順、承認、割当、プロフィール、支援イベント・記録と生成時点の参照を永続化する。Storageは非公開とし、公開ACLと一般公開URLを使わない。画像取得もAPI経由にする。
- WebSocketはweb-apiで受ける。接続先が別インスタンスでも状態を共有できるよう、各インスタンスが購読対象のFirestore更新を監視して通知する。接続中のメモリだけに担当者や作業状態を保持しない。Cloud Runのリクエスト期限による切断を前提に再接続を実装し、接続中の課金を含めて予算を確認する。[Cloud RunのWebSocket仕様](https://cloud.google.com/run/docs/triggering/websockets)
- サービスアカウントをweb、generator、task呼出用に分ける。Vertex AI実行権限はgeneratorへ付与する。Google認証は実行環境のサービスアカウントで行い、鍵ファイルを置かない。
- Cloud Buildでコンテナを作り、Artifact Registryに保存してCloud Runへデプロイする。Cloud LoggingにはrequestId、ジョブ状態、エラーコードだけを記録する。
- Cloud Runのローカルディスクは動画処理の一時領域だけに使い、処理後に削除する。永続化先にしない。

基盤は東京リージョンを基本とする。Vertexの利用ロケーションはAI担当の11/8午前の決定値を使う。基盤担当は同日午前にIAM、リージョン、課金アラートを設定する。最小インスタンス0、最大インスタンスはweb 2・generator 1。20ドル枠に対し5・10・15ドルの通知を設け、アラートを強制停止機能として扱わず、15ドル通知で基盤担当が生成受付を停止する。API側の10回制限とキュー並列1も併用する。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

接続アダプタと起動検査はあるが、本番配置・IAM・費用・期限削除の実運用確認は未完了。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
