---
type: Specification
title: 保存データ・状態遷移・保管期限
authority: normative
status: stable
---

# 保存データ・状態遷移・保管期限

Firestore Native modeに構造化データ、非公開Cloud Storageに動画・写真を保存する。FirestoreとStorageへブラウザから直接アクセスさせず、Cloud RunのAPIで権限を判定する。IDはサーバー生成UUID、時刻はサーバー時刻、工程時刻は動画先頭からの整数ミリ秒とする。

全ドキュメントに`orgId`、`createdAt`を持たせ、一覧も個別取得も認証主体の`orgId`を照合する。工程配列は最大20件。画像・動画のバイナリをFirestoreへ入れない。

| コレクション | 主なフィールド | 保存と更新の約束 |
| --- | --- | --- |
| `members` | `uid, orgId, role: staff / learner / newcomer, learnerId?` | 管理用スクリプトで登録。ブラウザからroleを書き換えられない |
| `learners` | `displayName, preferences:{sentenceLength?, splitHints?, displayMode?, audioGuidance?}, learnerWishes?, staffObservations?, staffSuggestions?, confirmedGuidance?, disabilityInfo?:{detail, source, confirmedAt}, enteredBy, updatedBy, revision` | 所属が一致する職員だけが登録・更新する。デモは架空データ。障害に関する情報は本人が共有を希望する支援上必要な内容に限り、記録は任意 |
| `tasks` | `title, videoAssetId, status: uploading / ready, createdBy` | 動画実体の検査完了でready |
| `assets` | `kind: video / image / audio, objectPath, generation, mimeType, durationMs?, sourceVideoId?, frameMs?, visibility: staff / approved, releaseId?` | パスはAPI内部用。承認画像は版専用コピーを作り、上書きしない。audioは承認済み短文から生成した読み上げ音声とし、releaseIdにひも付く承認版専用資産とする |
| `videoUploads` | `taskId, createdBy, size, received, objectPath, session, status: uploading / completed / rejected, generation?, assetId?, lockToken?, lockUntil?` | 動画の分割アップロードの記録。`session` はCloud Storageの再開用URIまたはローカルの一時IDで、API内部専用とし、どのレスポンスにもログにも出さない。受信量の確認と更新はトランザクションで行い、送信中はロックで同じアップロードへの二重送信を防ぐ。完了時にassetを作り作業をreadyにする |
| `generationJobs` | `taskId, draftId, status, attempt, modelId, promptVersion, inputSnapshot, errorCode?, leaseUntil?` | 受付時の表示設定・説明方法・入力を固定。改善の場合は元の承認版と選択した記録の版も固定する。再試行は新ジョブ |
| `drafts` | `taskId, learnerId, jobId?, sourceReleaseId?, revision, status, aiProposal?, editedSteps, displayMode, audioGuidance, reviewChecks, appliedSupportRecordRefs?, updatedBy` | AI生成ではjobIdとaiProposalを持つ。手作業のコピーではsourceReleaseIdを持ち、jobIdとaiProposalは作らない。AI原文と職員編集値を分離し、生成時と編集後の設定を区別する |
| `releases` | `taskId, learnerId, sourceDraftId, sourceRevision, sourceReleaseId?, appliedSupportRecordRefs?, version, displayMode, audioGuidance, learnerSteps[], staffGuide[], approvedBy, approvedAt, contentHash` | 承認時に新規作成。表示方法・読み上げの希望・採用した記録の版も固定する。本文の更新・削除APIを設けない |
| `assignments` | `learnerId, taskId, releaseId, assignedBy, updatedAt` | 次回開始版へのポインタ。承認済みかつ本人ID一致の版だけを指す |
| `sessions` | `learnerId, releaseId, status, stepIndex, revision, activeSupportRequestId?, startedAt, endedAt?` | 開始時に版を固定。支援待ちでは対象の要求IDを保存する。進行はイベントと同一トランザクションで更新 |
| `sessionEvents` | `sessionId, clientEventId, type, stepId?, createdBy, receivedAt` | 進行・支援要求・停止・完了を追記。clientEventIdで重複排除 |
| `supportRequests` | `sessionId, eventId, learnerId, stepId, kind: help / stop / complete, status: open / assigned / in_progress / acknowledged, revision, assignedTo?, assignedAt?, startedBy?, startedAt?, acknowledgedBy?, acknowledgedAt?` | 職員の支援一覧用。担当決定・到着と開始・完了を別々に記録する。状態変更ごとにrevisionを増やす。停止イベントと完了イベントの通知にも使う。complete は本人が最後の工程で完了を記録した時に、完了イベントと同じトランザクションで作る |
| `supportRecords` | `supportRequestId, learnerId, taskId, releaseId, stepId, sessionId, observedDifficulty, assistanceGiven, improvementSuggestion, createdBy, updatedBy, updatedAt, revision` | 支援要求ごとに1件。対象IDはサーバーが要求とセッションから確定する。記録の参照は `{recordId, revision}` で行う |
| `draftCorrections` | `taskId, learnerId, draftId, draftRevision, changes:[{stepId,field,before,after}], reason?, createdBy, contextJobId?, contextSummary?` | 職員が保存した修正を記録する。修正前後の値はサーバーが確定し、履歴を保持する。要約結果はその履歴にだけ保存し、遅く完了した処理で新しい修正を上書きしない |
| `handoverReads` | `releaseId, newcomerUid, readAt` | 承認版を読んだ記録 |

修正履歴の工程追加・削除や未設定の項目は、存在しない側の値を `null` で表す。並替えはゼロ始まりの `position` の変更として記録する。工程は変更前後それぞれ最大20件のため、1回の保存に含む変更は最大480項目とする。確認チェックのみの変更は履歴に含めない。

`generationJobs` は `kind: guide / correction_context` を持つ。`guide` は手順の下書き、`correction_context` は手直しの参考メモを生成する。受付時の設定と入力を固定する。手順の改善では元の承認版・選択した記録・使用する修正履歴の版も固定する。再試行は新ジョブ。

`displayMode` は `photo_only`（写真のみ）または `photo_text`（写真と短文）。プロフィールで未確認なら項目を省略でき、下書きの初期値は `photo_text` とする。表示方法が保存されていない旧承認版も `photo_text` として扱い、読み上げは版に承認済み音声がある工程に限る。プロフィールを変更しても、既存の承認版や実行中の表示を変更しない。

`learnerSteps` は `{stepId, order, imageAssetId, imageAltText, audioAssetId?, text, visibleCaution}`、`staffGuide` は `{stepId, sourceStartMs, sourceEndMs, verifiedObservation, verifiedSpeech, coaching, completionCheck}` とする。写真のみの版も、照合・支援・引き継ぎに必要な短文、注意、声かけを承認版に保持する。

改善ジョブには元の承認版、選択した記録のID・revisionと送信用の内容、確認済みの説明方法を受付時に固定する。その後に追加・編集された記録は次回の候補に残す。職員が実際に反映した記録の版を、選択した記録の中から承認版に残す。未反映件数は、次回用の割当版とその継承元で採用済みの記録版を除いて数える。生成に参照しただけの記録は未反映のままとする。

## 状態遷移

- 生成ジョブ：`queued → running → succeeded | failed`。Cloud Tasksの再配送は同じジョブを検査し、成功済みなら終了。実行中はリースを使い、切れたリースだけを取り直す。試行上限は3回。
- 下書き：AI生成は`generating → editing → approved`、生成失敗は`generating → failed`。承認版から手作業用にコピーすると、新しいdraftIdをeditingで作る。承認時に編集を閉じる。再生成も別draftIdとし、旧下書きと承認版を保存する。
- 承認処理：版専用の画像を先に用意し、トランザクションで下書きrevision・確認欄を検査してrelease作成とdraftのapproved化を同時実行する。競合は409。失敗して残った画像は職員にも本人にも配信せず、保管期限で消す。[Firestoreのトランザクション仕様](https://cloud.google.com/firestore/native/docs/manage-data/transactions)
- セッション：`active → waiting_help → active`、`active | waiting_help → stopped`、`active → completed`、`completed → stopped`（stopイベントのみ）。`completed`はstop以外の進行イベントに対して終端とし、新たな進行イベントは409で拒否する。本人の「やめる」は常に優先し、完了後に遅延到着したstopも受け付ける。stopとcompleteが競合した場合も、最終状態はstoppedとする。`stopped`は終端とし、停止の再送は成功扱い、停止後の進行イベントは409で拒否する。再開は担当職員の「対応を終えてつづける」、または対応完了後の本人の「つづける」で行う。再開時はactiveSupportRequestIdを外し、版と工程は保つ。
- 支援要求：`help` は `open → assigned → in_progress → acknowledged`（未担当・担当決定・対応中・対応完了）、`stop` は `open → acknowledged`（停止通知の確認）、`complete` は `open → acknowledged`（完了通知の確認）。stop と complete は担当決定・開始・記録・再開の対象にしない。担当決定はトランザクションで行う。担当職員だけがhelpの開始・完了・職員側からの再開を操作できる。同じ職員の担当決定・開始・完了の再送では元の職員と時刻を保つ。記録の入力や生成の状態は要求と分ける。

完了の記録とセッションの現在状態は区別する。受理済みのcompleteイベントは`sessionEvents`の履歴に残し、後からstopを受け付けても削除・変更しない。遅延stopの到着後も完了記録を履歴から参照できるが、セッションの現在状態は`stopped`とする。完了通知の要求（kind: complete）も遅延stopで削除・変更せず、stopの要求を別に作る。

Cloud Storageは`source/{orgId}/{taskId}/...`、`draft/{orgId}/{draftId}/...`、`approved/{orgId}/{releaseId}/...`に分ける。本人へ配信するのは、次回用に割り当てられた版または本人のセッションに固定された版の承認画像・音声。元動画は職員と、その承認版を読む新人に配信する。新人には承認済み区間のリンクを付ける。

11/14まではデモと提出用URLを維持する。デモ用素材・プロフィール・操作履歴・支援記録・修正履歴と参考メモ・生成時の入力スナップショットは11/15に基盤担当が削除し、公開提出動画はチーム素材だけで構成する。ログにプロンプト本文、動画、プロフィール、支援記録、修正履歴、認証トークンを出さない。音声入力は文字起こしを確認してから保存し、録音を支援記録に含めない。音声入力に失敗しても入力済みの文字を保つ。
