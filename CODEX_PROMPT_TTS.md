このリポジトリの中核MVPに追加フェーズとして、本人向け手順の「音声読み上げ（TTS）」を実装してください。正本は docs/design-freeze-2026-11-07.md の音声に関する記述（第1節、第2節本人画面、第3節の audioGuidance / assets kind: audio / learnerSteps.audioAssetId、第4節の Gemini TTS 段落、第9節 P1）です。既存の中核フローと既存テストを壊さないこと。

## 実装する内容
1. プロフィール：learners の preferences.audioGuidance を boolean にする（現状 false 固定なら解除する）。シードで片方の架空プロフィール（Bさん）を audioGuidance: true にし、もう片方は false のままにする。
2. 承認時生成：承認処理の一部として、対象プロフィールが audioGuidance: true の場合のみ、各工程の「承認済み短文」から読み上げ音声を生成する。
   - 生成は TtsAdapter インターフェース経由。入力は承認済み短文のみ。未承認の下書きテキストをアダプタに渡してはならない。
   - 生成した音声は assets に kind: "audio"、visibility: "approved"、releaseId 紐付けで保存し、learnerSteps の audioAssetId に設定する。写真の承認版コピーと同じ扱いにする。
   - audioGuidance: false のプロフィールでは音声を一切生成しない。
   - TTS生成に失敗した場合、承認は失敗として職員にエラーを返す（音声なしの版を黙って公開しない）。
3. アダプタ実装：
   - ローカル用 Fake 実装：ffmpeg でテキスト長に応じた長さの無音に近いプレースホルダ WAV を生成する。実音声でないことを README に明記する。
   - 実 Vertex AI Gemini TTS 用のアダプタ骨格も用意し、環境変数 TTS_PROVIDER=vertex と TTS_MODEL（既定 gemini-2.5-flash-tts）で切り替える。ローカル実行では呼ばれないこと。
4. 配信と境界：本人は自分の割当版に含まれる音声だけを API 経由で取得できる（既存の asset 配信の権限検査に audio を含める）。他の本人の音声・下書き由来の音声は 403。本人用 DTO には audioAssetId のみを含め、Storage パスは含めない。
5. 本人画面：工程に audioAssetId がある場合のみ、読み上げの再生ボタン（audio 要素）を表示する。自動再生はしない。音声がない工程・プロフィールでは表示しない。

## 追加テスト（全件パスさせること）
- audioGuidance: true の承認で、工程ごとに audio 資産が作られ、本人セッションの DTO に audioAssetId が含まれる
- audioGuidance: false の承認では audio 資産が作られず、DTO に音声が含まれない
- TtsAdapter への入力が承認済み短文だけである（下書きテキストでは呼ばれない）
- 本人が自分の版の音声を取得できる／他人の版の音声は 403
- 承認後に再生成・新下書きを作っても、既存の承認版の音声は変わらない
- TTS失敗時に承認が失敗し、版が作られない

## 進め方
- 1フェーズとしてコミットする（例：feat: add approval-time TTS audio guidance）。
- 全テスト（既存＋追加）を実行し、結果を報告する。
- README に TTS の節を追加する：仕組み（承認時事前生成）、環境変数、Fake の位置づけ、実GCP接続時の残作業（Vertex TTS の実接続確認、料金確認）。
- APIキーや秘密情報は含めない。
