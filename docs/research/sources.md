---
type: Specification
title: 設計根拠と出典の使い方
authority: normative
status: stable
---

# 設計根拠と出典の使い方

> 資料は背景・比較・判断の根拠として参照する。資料中の施設名・制度区分をそのままアプリのUI条件分岐に変換しない。

## 認知アクセシビリティ調査の位置づけと読み順

[REPORT.md](REPORT.md) は、公式指針・研究・実装例を引用の連鎖で調べ、設計判断を支持する根拠、注意点、未確認事項を整理した調査資料である。B型事業所の作業手順提示を背景とした調査であり、[関連仕様](../product/overview.md)のA型・B型・一般企業等すべてでの有効性を実証するものではない。対象の本人・作業に適用できるかを確認する。

**採用済み仕様の正本はdocs内の `authority: normative` を持つ文書群とする。** レポート[第8・9節](../development/spec-migration.md)の提案と[関連仕様](../validation/evaluation.md)の審査説明文案は調査時点のものであり、現在の採否や実装・検証結果は現行仕様と実際の検証記録で確認する。プロフィール登録、写真のみ表示、ピクトグラム、支援記録による改善の採用内容は[第1〜4・8・13節](../development/spec-migration.md)に従う。

まずレポート[受入条件](../validation/acceptance.md)の対応表を読み、次に下表の関連節と出典台帳、最後に[関連仕様](../project/submission.md)の本人・現場への確認事項を確認する。設計の根拠を説明するときは、出典IDと、研究対象・評価指標・限界も確認する。指針の推奨、実証結果、製品の機能例、調査者の提案を区別する。

| 変更する領域 | レポートで読む箇所 | 現行仕様で照合する内容 |
| --- | --- | --- |
| 写真・短文・ピクトグラム、工程の粒度、文字・進捗表示 | [第1〜4節](../development/spec-migration.md)、[受入条件](../validation/acceptance.md)A1・A2、[関連仕様](../project/submission.md) | [第1〜3・8節](../development/spec-migration.md)の提示方法、本人と確認する設定、写真・代替テキストと操作・状態表示 |
| 音声・読み上げ | [関連仕様](../development/team.md)、[受入条件](../validation/acceptance.md)「音声」、[関連仕様](../project/submission.md) | [第1・4・9節](../development/spec-migration.md)の承認済み短文からの事前生成、版との対応、P1の採用条件 |
| 手伝って・もどる・やめる、通信断 | [関連仕様](../product/demo-task.md)、[受入条件](../validation/acceptance.md)A3〜A5、[関連仕様](../project/submission.md) | [第2〜4・8節](../development/spec-migration.md)の送信・担当決定・支援状態、本人または担当職員による再開、即時停止、終端状態、配信と保存の境界 |
| 職員の確認・承認、写真候補 | [第3・4・7節](../development/spec-migration.md)、[受入条件](../validation/acceptance.md)R1・R2、[関連仕様](../project/submission.md) | [第2・4・8節](../development/spec-migration.md)の原動画照合、提示内容・音声の確認、見落としと総作業時間 |
| 支援記録からの改善、AI生成指示・個別化 | [第2〜4・7節](../development/spec-migration.md)、[受入条件](../validation/acceptance.md)R1、[関連仕様](../project/submission.md) | [第2〜4・8節](../development/spec-migration.md)の本人の希望と観察・提案の区別、送信する要約、生成時の入力固定、人による採否と次回版への反映 |
| 本人参加、専門家レビュー、審査説明 | [第7・10・11節](../development/spec-migration.md) | [第8・10節](../development/spec-migration.md)の評価条件・結果・限界と提出する証拠 |

レポートA4の停止後の手順閲覧とA5の承認版キャッシュは検討案である。現在の動作には[第2〜4節](../development/spec-migration.md)の、停止時に手順を閉じる、停止したセッションは再開しない、API応答は `no-store` とする契約を適用する。ルビ設定、写真サムネイル列、写真候補3枚・自動初期選択なども、レポートの提案だけを理由に必須機能として追加せず、採用時に現行仕様を更新してレビューする。

この参照ルールは開発時の指示である。アプリ内のGeminiへ渡す内容と生成ルールは[関連仕様](../contracts/api.md)に従う。生成条件を変える場合は必要な条件を現行仕様・プロンプト・出力検証に反映し、レポート全文やプロフィール全文をモデル入力へ追加する指示とは扱わない。

## 公的資料・実装例

| 資料・前例（出典リンク） | 内容 | 11Aに合う点 |
| --- | --- | --- |
| [B型「わさびの里」手順書作成／島根県障がい者就労事業振興センター](https://yu-make.net/center/wp-content/uploads/2024/05/pickup_jigujirei.pdf#page=34) | 写真付き手順書を職員間で共有 | 教え方の統一と作成負担の軽減 |
| [B型「フーズくわの木」見える化・マニュアル作成／同センター](https://yu-make.net/center/wp-content/uploads/2024/05/pickup_jigujirei.pdf#page=25) | 写真・短文・ふりがなで工程を説明 | 本人に合う提示と職員への引き継ぎ |
| [作業分解票サンプル／JEED](https://www.jeed.go.jp/disability/supporter/intellectual/om5ru8000000c5rn-att/om5ru8000000c659.pdf) | ピーマン袋詰めの工程・写真・注意点 | 手順書に必要な項目の参考 |
| [職業訓練実践マニュアル 発達障害者編Ⅰ・第3章／JEED](https://www.jeed.go.jp/disability/supporter/intellectual/om5ru8000000c5rn-att/om5ru8000000c5uy.pdf#page=7) | 写真手順書と段階に応じた教え方 | 本人に合わせた説明方法 |
| [技能訓練指導案サンプル／JEED](https://www.jeed.go.jp/disability/supporter/intellectual/om5ru8000000c5rn-att/om5ru8000000c63t.pdf) | 実演・練習・振り返りの指導計画 | 新人職員向けの教え方ガイド |
| [B型「じゆうじざい」作業マニュアル](https://manual.jiyuujizai.com/index) | 主に支援職員向けのPC作業手順 | 職員が参照できる手順の共有 |
| [A型「TRID」お仕事の紹介](https://trid-web.jp/works) | 封入・検品・梱包などの作業紹介 | 対象作業と品質基準の検討 |
| [A型「mi&go」2025年度研修計画書](https://mi-go.jp/wp-content/uploads/b4ffeea9a0487c56f95a604ba0d50633.pdf) | 指導の標準化・手順書整備・新人OJTの計画 | 教え方の共有と新人研修 |
| [A型「フローラ」作業紹介](https://heartystep.org/work) | 生花の納品・手入れなどの作業紹介 | 複数の工程がある作業の検討 |
| [B型「リハスワーク相模原南」ものづくりの工夫](https://rehas-work.com/work/blog/article/dOKiVXi4) | 写真手順書と検品基準の見える化を紹介 | 本人が確認できる完成基準 |
| [障害者の就労支援対策の状況／厚生労働省](https://www.mhlw.go.jp/stf/newpage_40524.html) | A型・B型などの制度と役割 | 対象となる事業所の理解 |
| [社内支援の準備／JEED](https://www.jeed.go.jp/disability/data/handbook/q2k4vk000003lu1d.html) | 写真・注意点を使った作業手順の整理 | 手順の分解と本人に合う調整 |
| [清掃マニュアルを活用した育成事例／JEED](https://www.ref.jeed.go.jp/18/18153.html) | 知的障害者福祉工場での写真付き清掃手順 | 写真で動作と道具を伝える工夫 |
| [ICTを活用した業務改善ガイドライン／厚生労働省](https://www.mhlw.go.jp/content/12200000/000654236.pdf) | 障害福祉現場の業務改善と情報共有 | 現場の仕事に沿った導入方法 |
| [障害福祉現場における生産性向上の基本的な考え方／厚生労働省](https://www.mhlw.go.jp/content/12200000/001691014.pdf) | 当事者視点での課題整理・改善・評価 | 作業時間と支援の質の両面で評価 |
| [介護テクノロジー導入支援事業 成果報告書・2026年3月／厚生労働省掲載](https://www.mhlw.go.jp/content/12200000/001696968.pdf#page=4) | 障害福祉の支援業務の属人化と技術導入 | 経験や判断を共有する課題の背景 |
| [意思決定支援ガイドライン第2版／厚生労働省](https://www.mhlw.go.jp/stf/newpage_76171.html) | 本人の意思・選択を支える考え方 | 本人が選ぶ・助けを求める設計 |
| [アイコンによる理解支援／W3C COGA](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p07-icons-used/) | なじみのある絵を関連する操作の近くに添える | 本人がピクトグラムの意味を確認できるようにする |
| [非テキスト情報／W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)・[色の使用／W3C](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | 画像の代替、色以外の手がかり | 工程写真の代替テキスト、操作・状態の伝達 |
