---
type: Runbook
title: Firestoreの支援通知
authority: operational
status: stable
---

# Firestoreの支援通知

`REPOSITORY_BACKEND=firestore` を明示した場合、APIは公式 `@google-cloud/firestore` サーバーSDKとApplication Default Credentialsを使用する。`GOOGLE_CLOUD_PROJECT` と、信頼できる単一組織を表す `FIRESTORE_ORG_ID` が必須。既定以外のDBを使う場合は `FIRESTORE_DATABASE_ID` を指定する。MemoryRepositoryが既定であり、認証・Storage・Cloud Tasks・本番起動ガードの設定はこの変更では完了しない。

認証後の職員接続は `supportRequests` の同一orgを、本人接続は同一org・sessionの要求と本人のセッション文書を監視する。SDKの [onSnapshot](https://docs.cloud.google.com/firestore/native/docs/query-data/listen) は変更の合図として扱い、その内容を直接配信せず、DBトランザクションで保存済み状態を読み直してロール別DTOを組み立てる。NodeサーバーSDKの監視はWeb SDKのローカル書込通知とは異なる。本人・org・sessionが一致しない監視結果、購読エラー、読み直し時の認可エラーでは接続を閉じる。クライアントが再接続し最新状態を再取得する。

本人用の要求監視は `orgId == ...` と `sessionId == ...` の複数条件を使う。環境で必要なインデックスやFirestore Native mode、サービスアカウントの権限とリージョンをデプロイ担当が確認する。ローカル検証では `FIRESTORE_EMULATOR_HOST` を明示し、架空データだけを使う。Firebase Emulatorおよび実FirestoreでのSDK・トランザクション・インデックス・再接続は未検証。

フェイクを共有する2 APIインスタンスのテストでは、コミット後の担当・再開、未コミット変更の非配信、orgとsessionの分離、購読解除・エラー・再接続を確認した。このテストはEmulatorやCloud Runでの保証ではない。接続数に応じて購読が増えるため、実環境で接続数・読み取り回数・費用を測る。

2026-11-09の `npm audit` は追加SDKの間接依存経由でmoderate 4件（glob、minimatch、rimraf、google-gax）を報告した。`npm audit fix` では解消しなかった。別の旧SDKを試したところ報告数が6件となったため現行9系を使用する。影響範囲と修正版の有無は依存関係のレビューで確認する。
