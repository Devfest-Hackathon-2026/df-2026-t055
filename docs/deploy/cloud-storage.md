# Cloud Storage 接続

`STORAGE_BACKEND=cloud` を明示したAPIは、`STORAGE_BUCKET`、`GOOGLE_CLOUD_PROJECT` と Application Default Credentials を使って Cloud Storage JSON API に接続する。バケットは事前に非公開で作成し、APIのサービスアカウントに対象バケット内のオブジェクトの作成・読み取りに必要な権限を付与する。認証情報をリポジトリへ保存しない。既定はローカルストレージである。

新規アップロードとコピー先は `ifGenerationMatch=0` で既存オブジェクトの上書きを防ぐ。読み取りとコピー元は保存済み世代に一致することを要求する。世代番号は64ビット値を丸めないよう文字列のまま送受信する。ネットワーク障害などで保存結果が不明な場合、再試行が条件不一致で失敗することがあり、孤立オブジェクトの確認が必要になる。

実バケット・IAMでの接続確認、Cloud Tasks接続と本番起動ガードの解除は含まない。先行するFirestore接続PRへの依存がある。
