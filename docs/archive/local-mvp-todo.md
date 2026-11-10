---
type: Historical Record
title: 仮定と残作業
authority: historical
status: deprecated
---

# 仮定と残作業

- 仮定: ローカルは単一APIプロセス内のインメモリDBと非公開ローカルStorageを使う。再起動するとデータを消去する。generatorはAPIの内部実行口をHTTPで呼び、DBを共有する。GCPではRepository/Storage/Auth/Queueアダプタを置換する。
- 仮定: 開発専用Bearerは seed のアカウントID。外部公開は禁止し、本番起動は拒否する。内部呼出しは環境変数の共有トークン（ローカル専用）。GCPではOIDC検証へ置換する。
- 仮定: 全体生成上限の初期値は30ジョブ。ジョブのリース再取得もAPIで試行予算を予約し、1作業10回・全体上限を超えるモデル呼出しを禁止する。
- 仮定: reviewFlagsへの対応は職員の記録を1欄にまとめる。再開は支援要求の対応済み後に限る。
- 実動画は未提供。アップロードして使用する。Fakeは開発用の時刻付き候補を返し、画像は必ずそのアップロード動画から抽出する。
- 実GCP: VertexモデルID/ロケーション選定、SDK実装、Firestoreトランザクション、Storage、Firebase ID token、Cloud Tasks OIDC、IAM、Cloud Run/Build、保管期限設定とデプロイ。
- 仮定: プロフィール選択は生成要求時に行う（PATCHの正本契約にlearnerId変更がないため）。別プロフィールは新しい下書きを作る。
- 仮定: 時刻に対応する写真は、その時刻以前の直近フレーム。最終時刻も有効とし、原動画の最終フレームまでを対象にする。
- 仮定: seedのアカウントと本人IDはローカル操作説明用の固定識別子（a/b）。生成される作業・版・ジョブ・セッション・資産IDはUUID。
- 仮定: 作業一覧レスポンスに職員用generationJobs（jobId/draftId/status）を含め、編集途中の下書きへ戻れるようにする。
- 環境制約: 元リポジトリの.gitは読取専用。通常のgit commitは失敗した。別の書込可能なGit管理領域で5フェーズのコミットを作り、bundleとして引き渡す。
- 環境制約: npmレジストリへのネットワークとポート待受が禁止。テストは同一のFetch APIルーターをプロセス内で実行し、実ffprobe/ffmpegで検証。Vite固有の起動・ビルドとブラウザ実機操作はネットワーク・待受可能な環境で確認する。
