---
type: Feature
title: 本人の手順表示と即時停止
description: 開始時の承認版で1工程ずつ示し、支援要求・停止・完了を本人が選ぶ。
authority: normative
status: stable
feature_id: learner-session
scope: core
implementation: present
verification: automated
assessed_commit: ca5b71f936bc6ebde5fc7f5cd2ec36a3a1a802c3
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/5
  - https://github.com/Genk-AI/df-2026-t055/issues/6
  - https://github.com/Genk-AI/df-2026-t055/issues/25
  - https://github.com/Genk-AI/df-2026-t055/issues/52
  - https://github.com/Genk-AI/df-2026-t055/issues/60
  - https://github.com/Genk-AI/df-2026-t055/issues/74
  - https://github.com/Genk-AI/df-2026-t055/issues/79
  - https://github.com/Genk-AI/df-2026-t055/issues/154
code:
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - apps/web/src/safety.ts
  - apps/web/src/learner-display.ts
tests:
  - tests/api-session-projection.test.ts
  - tests/web-stop-safety.test.ts
  - tests/web-learner-display.test.ts
  - tests/acceptance.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
  - docs/implementation-audits/20261110-1523-e4196ca.md
gaps:
  - 本人による理解・実端末での通信断と停止の評価は未検証。
verification_scope: local-automated-tests
---

# 本人の手順表示と即時停止

## 本人：選ぶ・進める・支援を求める

1. 職員が本人用端末で本人アカウントをログイン済みにし、`/me`を開く。職員が割り当てた承認版の作業名と「はじめる」が返る。割当がなければ「職員をよんでください」と表示する。
2. 本人が「はじめる」を押すと、セッションと固定の版IDを作成し、`/me/sessions/{sessionId}`へ進む。承認版の表示方法で1工程ずつ写真を示す。「写真と短文」では工程文を添え、「写真のみ」では工程文と文字の注意書きの可視表示を省く。写真の意味は代替テキストで伝える。職員は本人と一対一で手本を示し、必要な注意の伝え方を確かめる。操作ラベルと状況の表示は両方式で保つ。現在位置を示し、「もどる」「つぎへ」、最終工程の「おわる」は本人が操作する。作業の完了を記録すると、同じ所属の職員の支援一覧へ完了を通知する。サーバーが完了を受け付けた後、「おわりました」画面で「職員に しらせました」と示す。送信成功前には示さない。「おわりました」画面の「おわります」を押すと、「きょうの さぎょう」に戻る。読み上げは版に保存された希望と承認済み音声に従い、本人が再生する。
3. 作業中の本人画面で「手伝って」「やめる」を固定表示する。「手伝って」で進行を止め、支援待ちの表示を開く。送信中、サーバーが呼出しを受け付けて職員を待っている状態、担当者が決まった状態を文字と絵で伝える。担当職員が支援後に「対応を終えてつづける」を押すと、同じ工程へ戻る。職員が対応完了だけを記録した場合は、本人が「つづける」を押して戻れる。もう一度「手伝って」を選んだ場合は別の支援要求として扱う。
4. 「やめる」は確認ダイアログを挟まず、直ちに写真・手順と進行ボタンを閉じて「作業をやめました」を出す。端末上で即時停止し、停止イベントを送信する。停止したセッションは再開しない。再開希望は職員と相談して新規セッションを作る。
5. 通信失敗でも停止状態を保つ。支援要求の送信失敗時は「近くの職員をよんでください」と表示し、端末内の送信待ちイベントを再送する。送信成功前に「職員に届きました」と表示しない。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

本人による理解・実端末での通信断と停止の評価は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
