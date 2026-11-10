---
type: Issue Mapping
title: Issueと機能仕様の対応
authority: navigation
status: stable
---

# Issueと機能仕様の対応

2026-11-10T05:05:27.519Z時点でGitHub CLIから86件を取得した。連携検索では0件だったためCLIで照合した。状態は取得時点のスナップショットであり、Issueのcloseとコードの実装・検証状況を同一視しない。外部Issueの本文・状態は変更していない。

新しいIssueとPRは`docs/features/<機能>.md`と受入条件を指定する。既存のPRODUCT_SPECの節参照は[移行表](spec-migration.md)と[旧リンクの案内](../PRODUCT_SPEC.md)で解決する。要件をIssueだけで更新せず、同じPRでdocsの仕様を変更する。

機械向けの取得結果と対応先は[issues.json](issues.json)、現在の仕様から引く一覧は`devenv shell -- npm run --silent docs:issues -- --json`を使う。今後Issueを追加したら、機能文書の`issues`を更新する。JSONのGitHub状態は明示的な再取得まで更新されない。

| Issue | 取得時の状態 | 機能・共通仕様 |
| --- | --- | --- |
| [#1 [P0][Foundation] 既存MVPコードをmainへ移植して正本参照を更新](https://github.com/Genk-AI/df-2026-t055/issues/1) | CLOSED | [docs/development/workflow.md](workflow.md) |
| [#2 [P0][Contract] 新仕様に合わせ共有型・API契約・fixtureを更新](https://github.com/Genk-AI/df-2026-t055/issues/2) | CLOSED | [docs/development/workflow.md](workflow.md) |
| [#3 [P0][API] 本人プロフィール登録・更新APIと情報境界を実装](https://github.com/Genk-AI/df-2026-t055/issues/3) | CLOSED | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#4 [P0][Web] 職員の本人プロフィール登録・編集UIを実装](https://github.com/Genk-AI/df-2026-t055/issues/4) | OPEN | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#5 [P0][API] 写真のみモード・代替テキスト・承認版固定を実装](https://github.com/Genk-AI/df-2026-t055/issues/5) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) / [docs/features/learner-session.md](../features/learner-session.md) |
| [#6 [P0][Web] 本人向け1工程表示を写真のみ・ピクトグラム対応](https://github.com/Genk-AI/df-2026-t055/issues/6) | OPEN | [docs/features/learner-session.md](../features/learner-session.md) / [docs/features/pictogram-controls.md](../features/pictogram-controls.md) |
| [#7 [P0][API] 支援要求の開始・完了・支援記録APIを実装](https://github.com/Genk-AI/df-2026-t055/issues/7) | CLOSED | [docs/features/support-records.md](../features/support-records.md) / [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#8 [P0][Web] 職員の支援対応・つまずき記録画面を実装](https://github.com/Genk-AI/df-2026-t055/issues/8) | OPEN | [docs/features/support-records.md](../features/support-records.md) / [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#9 [P0][AI] Vertex AI Geminiの実動画解析・結果検査を実装](https://github.com/Genk-AI/df-2026-t055/issues/9) | OPEN | [docs/features/draft-generation.md](../features/draft-generation.md) |
| [#10 [P0][GCP] Firebase認証・Firestore・Cloud Storageを接続](https://github.com/Genk-AI/df-2026-t055/issues/10) | OPEN | [docs/features/authentication.md](../features/authentication.md) / [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#11 [P0][Deploy] Cloud Tasks・Cloud Runへデプロイして費用を制御](https://github.com/Genk-AI/df-2026-t055/issues/11) | OPEN | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#12 [P0][QA] エンドツーエンド・認可・承認・停止の受入テスト](https://github.com/Genk-AI/df-2026-t055/issues/12) | OPEN | [docs/features/handover.md](../features/handover.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#13 [P0][Demo] 作業動画・比較検証・提出資料と公開URLを整える](https://github.com/Genk-AI/df-2026-t055/issues/13) | OPEN | [docs/product/demo-task.md](../product/demo-task.md) / [docs/project/submission.md](../project/submission.md) |
| [#14 [P1][AI-API] 支援記録から次回用マニュアルの下書きを非同期生成](https://github.com/Genk-AI/df-2026-t055/issues/14) | OPEN | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#15 [P1][Web] 職員の本人別作業一覧・改善指示・差分確認UI](https://github.com/Genk-AI/df-2026-t055/issues/15) | OPEN | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#16 [P1][TTS] Gemini TTSを実接続し承認済み音声として配信](https://github.com/Genk-AI/df-2026-t055/issues/16) | OPEN | [docs/features/tts.md](../features/tts.md) |
| [#17 [Design Gate] 未確定の設計変更PRを判定し採用後にのみ実装Issue化](https://github.com/Genk-AI/df-2026-t055/issues/17) | OPEN | [docs/features/speech-input.md](../features/speech-input.md) |
| [#18 [P1][Automation] Issue単位でAI実装PRを作る運用とチェックを整備](https://github.com/Genk-AI/df-2026-t055/issues/18) | OPEN | [docs/development/workflow.md](workflow.md) |
| [#19 [P0][Foundation] 旧MVPの実装資産を現行mainへ移す](https://github.com/Genk-AI/df-2026-t055/issues/19) | CLOSED | [docs/development/workflow.md](workflow.md) |
| [#20 [P0][撮影担当] タオル包装の手本MP4と比較素材を用意する](https://github.com/Genk-AI/df-2026-t055/issues/20) | OPEN | [docs/features/draft-generation.md](../features/draft-generation.md) / [docs/product/demo-task.md](../product/demo-task.md) / [docs/project/submission.md](../project/submission.md) |
| [#21 [Design][設計判断] 採用済み4案と残る設計判断を棚卸しする](https://github.com/Genk-AI/df-2026-t055/issues/21) | OPEN | [docs/features/speech-input.md](../features/speech-input.md) / [docs/development/workflow.md](workflow.md) |
| [#22 [Design][設計判断] 支援記録の音声入力方式と全画面展開の採否を決める](https://github.com/Genk-AI/df-2026-t055/issues/22) | OPEN | [docs/features/speech-input.md](../features/speech-input.md) |
| [#23 [P0][Foundation] ローカル起動手順と既存デモの動作を確認する](https://github.com/Genk-AI/df-2026-t055/issues/23) | CLOSED | [docs/development/workflow.md](workflow.md) |
| [#24 [P0][Contract] 本人プロフィールの共有スキーマとAPI例を定義する](https://github.com/Genk-AI/df-2026-t055/issues/24) | CLOSED | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#25 [P0][Contract] 下書き・承認版・本人セッションの共有契約を分ける](https://github.com/Genk-AI/df-2026-t055/issues/25) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) / [docs/features/manual-revision.md](../features/manual-revision.md) / [docs/features/learner-session.md](../features/learner-session.md) |
| [#26 [P0][Contract] 支援の状態遷移・記録・通知の共有契約を定義する](https://github.com/Genk-AI/df-2026-t055/issues/26) | CLOSED | [docs/features/support-records.md](../features/support-records.md) / [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#27 [P0][Contract] 生成入力と手直し履歴・参考メモの共有契約を定義する](https://github.com/Genk-AI/df-2026-t055/issues/27) | CLOSED | [docs/features/draft-generation.md](../features/draft-generation.md) / [docs/features/correction-history.md](../features/correction-history.md) |
| [#28 [P0][GCP] Firestore Repositoryを接続し競合更新を検証する](https://github.com/Genk-AI/df-2026-t055/issues/28) | CLOSED | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#29 [P0][GCP] 非公開Cloud Storageの資産ストリームと世代固定を実装する](https://github.com/Genk-AI/df-2026-t055/issues/29) | CLOSED | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#30 [P0][Deploy] web-apiとgeneratorのコンテナをビルド可能にする](https://github.com/Genk-AI/df-2026-t055/issues/30) | CLOSED | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#31 [P1][TTS] Vertex TTSの実アダプタと設定を実装する](https://github.com/Genk-AI/df-2026-t055/issues/31) | OPEN | [docs/features/tts.md](../features/tts.md) |
| [#32 [P1][Automation] PRの型検査・テスト・ビルドをCIで検証する](https://github.com/Genk-AI/df-2026-t055/issues/32) | CLOSED | [docs/development/workflow.md](workflow.md) |
| [#33 [P0][API] 本人プロフィールの登録・一覧・詳細APIを実装する](https://github.com/Genk-AI/df-2026-t055/issues/33) | CLOSED | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#34 [P0][API] 支援要求一覧と職員の担当決定を実装する](https://github.com/Genk-AI/df-2026-t055/issues/34) | CLOSED | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#35 [P0][AI] Vertex VideoModelのSDK接続と入力の許可リストを作る](https://github.com/Genk-AI/df-2026-t055/issues/35) | CLOSED | [docs/features/draft-generation.md](../features/draft-generation.md) |
| [#36 [P0][GCP] Firebase IDトークン認証とデモアカウントの紐づけを作る](https://github.com/Genk-AI/df-2026-t055/issues/36) | CLOSED | [docs/features/authentication.md](../features/authentication.md) |
| [#37 [P1][Automation] 1サブIssueから1PRを作るチーム手順を整える](https://github.com/Genk-AI/df-2026-t055/issues/37) | OPEN | [docs/development/workflow.md](workflow.md) |
| [#38 [P0][API] 本人プロフィールのrevision付き更新と任意情報削除を実装する](https://github.com/Genk-AI/df-2026-t055/issues/38) | CLOSED | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#39 [P0][Web] 職員の本人一覧とプロフィール登録画面を作る](https://github.com/Genk-AI/df-2026-t055/issues/39) | OPEN | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#40 [P0][API] 下書きに作業別の提示設定と代替テキストを保存する](https://github.com/Genk-AI/df-2026-t055/issues/40) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) |
| [#41 [P0][API] 担当職員の対応開始・完了と停止通知確認を実装する](https://github.com/Genk-AI/df-2026-t055/issues/41) | CLOSED | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#42 [P0][AI] Vertexの生成結果を検証し失敗をジョブへ反映する](https://github.com/Genk-AI/df-2026-t055/issues/42) | CLOSED | [docs/features/draft-generation.md](../features/draft-generation.md) |
| [#43 [P0][Web] プロフィール編集・任意情報削除・競合復帰を作る](https://github.com/Genk-AI/df-2026-t055/issues/43) | CLOSED | [docs/features/learner-profile.md](../features/learner-profile.md) |
| [#44 [P0][API] 下書きの変更内容に応じて確認チェックを解除する](https://github.com/Genk-AI/df-2026-t055/issues/44) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) |
| [#45 [P0][API] 支援記録の取得・後入力・競合更新を実装する](https://github.com/Genk-AI/df-2026-t055/issues/45) | CLOSED | [docs/features/support-records.md](../features/support-records.md) |
| [#46 [P0][AI] 原動画から候補写真を切り出して下書きへ紐づける](https://github.com/Genk-AI/df-2026-t055/issues/46) | CLOSED | [docs/features/draft-generation.md](../features/draft-generation.md) |
| [#47 [P0][Deploy] Cloud Tasksの配送とgeneratorのOIDC・リースを実装する](https://github.com/Genk-AI/df-2026-t055/issues/47) | CLOSED | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#48 [P0][API] 確認済み下書きを不変の承認版として保存する](https://github.com/Genk-AI/df-2026-t055/issues/48) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) |
| [#49 [P0][AI検証] チーム撮影のMP4でVertex出力と生成時間を実測する](https://github.com/Genk-AI/df-2026-t055/issues/49) | OPEN | [docs/features/draft-generation.md](../features/draft-generation.md) |
| [#50 [P0][Deploy] 費用アラート・生成受付停止・保管期限の運用を整える](https://github.com/Genk-AI/df-2026-t055/issues/50) | OPEN | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#51 [P1][API] 下書きの手直し差分を保存時に履歴へ記録する](https://github.com/Genk-AI/df-2026-t055/issues/51) | CLOSED | [docs/features/correction-history.md](../features/correction-history.md) |
| [#52 [P0][API] 本人セッションに固定版の表示方式と工程だけを返す](https://github.com/Genk-AI/df-2026-t055/issues/52) | CLOSED | [docs/features/learner-session.md](../features/learner-session.md) |
| [#53 [P0][API] 承認版から手作業用の下書きを作成する](https://github.com/Genk-AI/df-2026-t055/issues/53) | CLOSED | [docs/features/manual-revision.md](../features/manual-revision.md) |
| [#54 [P0][Web] 職員の下書き編集に提示プレビューと再確認を追加する](https://github.com/Genk-AI/df-2026-t055/issues/54) | CLOSED | [docs/features/draft-review.md](../features/draft-review.md) |
| [#55 [P1][AI] 手直しの参考メモを非同期生成して履歴に保存する](https://github.com/Genk-AI/df-2026-t055/issues/55) | CLOSED | [docs/features/correction-history.md](../features/correction-history.md) |
| [#56 [P0][API] メディア取得をロールと対象の承認版で制限する](https://github.com/Genk-AI/df-2026-t055/issues/56) | CLOSED | [docs/features/authentication.md](../features/authentication.md) |
| [#57 [P0][Web] 職員の承認版画面にコピーして直す導線を作る](https://github.com/Genk-AI/df-2026-t055/issues/57) | CLOSED | [docs/features/manual-revision.md](../features/manual-revision.md) |
| [#58 [P0][API] 職員と本人の再開操作を対象の支援要求に結びつける](https://github.com/Genk-AI/df-2026-t055/issues/58) | CLOSED | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#59 [P1][API] 本人別の作業一覧と支援記録を職員用に取得する](https://github.com/Genk-AI/df-2026-t055/issues/59) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#60 [P0][Web] 本人の1工程表示を固定版の2モードに対応させる](https://github.com/Genk-AI/df-2026-t055/issues/60) | CLOSED | [docs/features/learner-session.md](../features/learner-session.md) |
| [#61 [P0][API] 支援のWebSocket認証とロール別通知を実装する](https://github.com/Genk-AI/df-2026-t055/issues/61) | CLOSED | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#62 [P0][Web] 職員の支援一覧に担当・対応開始・完了を追加する](https://github.com/Genk-AI/df-2026-t055/issues/62) | OPEN | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#63 [P0][QA] ロール境界・承認の二重送信・固定版の回帰を確認する](https://github.com/Genk-AI/df-2026-t055/issues/63) | OPEN | [docs/features/authentication.md](../features/authentication.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#64 [P1][API] 支援記録からの改善要求を固定スナップショットで受け付ける](https://github.com/Genk-AI/df-2026-t055/issues/64) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#65 [P1][Web] 職員の本人別作業カードに次回版と改善状態を出す](https://github.com/Genk-AI/df-2026-t055/issues/65) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#66 [P0][Web] 本人の操作ボタンにピクトグラムと短い操作名を付ける](https://github.com/Genk-AI/df-2026-t055/issues/66) | OPEN | [docs/features/pictogram-controls.md](../features/pictogram-controls.md) |
| [#67 [P0][Web] 支援記録フォームに後入力と保存失敗時の復帰を作る](https://github.com/Genk-AI/df-2026-t055/issues/67) | OPEN | [docs/features/support-records.md](../features/support-records.md) |
| [#68 [P0][GCP] 支援通知をFirestore購読でCloud Run間に配信する](https://github.com/Genk-AI/df-2026-t055/issues/68) | CLOSED | [docs/features/support-workflow.md](../features/support-workflow.md) / [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#69 [P1][AI・API] 改善ジョブのモデル入力と採用した記録版の保存を実装する](https://github.com/Genk-AI/df-2026-t055/issues/69) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#70 [P1][AI] 次回生成に同じ本人・作業の手直し履歴を引き継ぐ](https://github.com/Genk-AI/df-2026-t055/issues/70) | CLOSED | [docs/features/correction-history.md](../features/correction-history.md) |
| [#71 [P1][Web] 支援記録の選択・送信用要約確認・改善依頼を実装する](https://github.com/Genk-AI/df-2026-t055/issues/71) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#72 [P1][Web] 職員の作業詳細で手直し履歴とAI参考メモを確認する](https://github.com/Genk-AI/df-2026-t055/issues/72) | CLOSED | [docs/features/correction-history.md](../features/correction-history.md) |
| [#73 [P1][TTS] 承認時だけ音声を生成し版専用の資産として配信する](https://github.com/Genk-AI/df-2026-t055/issues/73) | CLOSED | [docs/features/tts.md](../features/tts.md) |
| [#74 [P0][Web] 本人端末で停止を即時確定し通信回復まで維持する](https://github.com/Genk-AI/df-2026-t055/issues/74) | CLOSED | [docs/features/learner-session.md](../features/learner-session.md) |
| [#75 [P0][Web] 職員の支援一覧をWebSocket更新とHTTPフォールバックに対応させる](https://github.com/Genk-AI/df-2026-t055/issues/75) | OPEN | [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#76 [P1][Web] 支援記録に訂正して保存できる音声入力を追加する](https://github.com/Genk-AI/df-2026-t055/issues/76) | OPEN | [docs/features/speech-input.md](../features/speech-input.md) |
| [#77 [P0][Deploy] Cloud Runへ配置して公開HTTPSと内部ジョブを確認する](https://github.com/Genk-AI/df-2026-t055/issues/77) | OPEN | [docs/features/cloud-platform.md](../features/cloud-platform.md) |
| [#78 [P1][Web] 元版と改善下書きの差分・採用記録を確認する](https://github.com/Genk-AI/df-2026-t055/issues/78) | CLOSED | [docs/features/guide-improvement.md](../features/guide-improvement.md) |
| [#79 [P0][Web] 本人の支援待ち画面を担当・再開通知に対応させる](https://github.com/Genk-AI/df-2026-t055/issues/79) | CLOSED | [docs/features/learner-session.md](../features/learner-session.md) / [docs/features/support-workflow.md](../features/support-workflow.md) |
| [#80 [P0][QA] 実動画から承認・本人提示・新人参照まで結合確認する](https://github.com/Genk-AI/df-2026-t055/issues/80) | OPEN | [docs/features/handover.md](../features/handover.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#81 [P0][QA] 支援の担当競合・通信断・停止優先を結合確認する](https://github.com/Genk-AI/df-2026-t055/issues/81) | OPEN | [docs/features/support-workflow.md](../features/support-workflow.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#82 [P0][QA] 本人の表示・ピクトグラム・停止のアクセシビリティを確認する](https://github.com/Genk-AI/df-2026-t055/issues/82) | OPEN | [docs/features/pictogram-controls.md](../features/pictogram-controls.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#83 [P0][検証担当] 4方式の比較と初見の引き継ぎを実測する](https://github.com/Genk-AI/df-2026-t055/issues/83) | OPEN | [docs/features/handover.md](../features/handover.md) / [docs/validation/acceptance.md](../validation/acceptance.md) |
| [#84 [P0][提出担当] デモ録画と提出物・公開URLを照合する](https://github.com/Genk-AI/df-2026-t055/issues/84) | OPEN | [docs/product/demo-task.md](../product/demo-task.md) / [docs/project/submission.md](../project/submission.md) |
| [#151 プロダクトの名前を考える](https://github.com/Genk-AI/df-2026-t055/issues/151) | OPEN | [docs/product/overview.md](../product/overview.md) |
| [#154 [Web] 本人の作業完了画面に「おわります」ボタンを追加してホームに戻れるようにする](https://github.com/Genk-AI/df-2026-t055/issues/154) | CLOSED | [docs/features/learner-session.md](../features/learner-session.md) |
