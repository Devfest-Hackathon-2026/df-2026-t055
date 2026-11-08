# Firebase認証の接続

APIでは `AUTH_BACKEND=firebase`、`FIREBASE_PROJECT_ID`（省略時 `GOOGLE_CLOUD_PROJECT`）、`FIRESTORE_ORG_ID` とApplication Default Credentialsを指定する。Firebase Admin SDKがIDトークンの署名・発行元・対象・期限と失効を検証し、サーバーに登録された所属・役割を照合する。権限のない、未登録、失効したアカウントは拒否する。Firebase Authエミュレータの設定を本番へ渡さない。

Webのビルド時に `VITE_AUTH_BACKEND=firebase`、`VITE_FIREBASE_API_KEY`、`VITE_FIREBASE_AUTH_DOMAIN`、`VITE_FIREBASE_PROJECT_ID` を設定する。公開Web設定は秘密鍵ではないが、正しいFirebaseプロジェクトと許可ドメインの確認が必要。Firebase側でメール・パスワード認証と事前登録アカウントを設定し、同じ組織のmembersにUIDを紐づける。画面は検証済みのサーバー応答から役割を決定し、Firebaseモードでデモトークンにフォールバックしない。デモアカウント切替はローカルのdemoモードのみ。

既存の本人・職員レコードへの紐づけには `REPOSITORY_BACKEND=firestore`、`GOOGLE_CLOUD_PROJECT`、`FIRESTORE_ORG_ID` を明示し、担当者が対象を確認したうえで `node --experimental-transform-types scripts/member-link.ts scripts/firestore-member-repository.ts link <firebase-uid> <member-id>` を使う。標準出力へUIDや引数は表示しない。解除は `unlink`。必要なIAM権限を与えた環境で実行し、変更前後を担当者が確認する。

この変更ではFirebaseプロジェクト、アカウント、IAM、Web設定の作成や実接続テストは行わない。本番APIの起動ガードは残る。デプロイ前にFirebaseモードでビルドした成果物とAPI設定が一致すること、実アカウントの権限境界、失効、ログアウト、本人の停止・再接続を確認する。
