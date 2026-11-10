---
type: Feature
title: 支援の担当・対応・再開通知
description: 担当を一人に確定し、支援状態をHTTPとWebSocketで両画面へ共有する。
authority: normative
status: stable
feature_id: support-workflow
scope: core
implementation: present
verification: automated
assessed_commit: 91ee00d4a78ddf5c7662c1f83b817c5b6014d0b6
owner: unassigned
issues:
  - https://github.com/Genk-AI/df-2026-t055/issues/7
  - https://github.com/Genk-AI/df-2026-t055/issues/8
  - https://github.com/Genk-AI/df-2026-t055/issues/26
  - https://github.com/Genk-AI/df-2026-t055/issues/34
  - https://github.com/Genk-AI/df-2026-t055/issues/41
  - https://github.com/Genk-AI/df-2026-t055/issues/58
  - https://github.com/Genk-AI/df-2026-t055/issues/61
  - https://github.com/Genk-AI/df-2026-t055/issues/62
  - https://github.com/Genk-AI/df-2026-t055/issues/68
  - https://github.com/Genk-AI/df-2026-t055/issues/75
  - https://github.com/Genk-AI/df-2026-t055/issues/79
  - https://github.com/Genk-AI/df-2026-t055/issues/81
code:
  - apps/api/src/support-ws.ts
  - apps/api/src/app.ts
  - apps/web/src/main.tsx
  - apps/web/src/staff-support.tsx
  - apps/web/src/support-ws.ts
tests:
  - tests/api-support-claim.test.ts
  - tests/api-support-websocket.test.ts
  - tests/web-staff-support.test.ts
evidence:
  - docs/implementation-audits/20261110-1409-91ee00d.md
gaps:
  - Cloud Run複数インスタンス間の実接続と通信断時の操作は未検証。
verification_scope: local-automated-tests
---

# 支援の担当・対応・再開通知

9. `/staff/support`：支援一覧を開いている同じ所属の職員に、WebSocketで呼出しを通知する。職員が「担当します」を押すと担当者が決まり、ほかの職員の一覧にも担当済みと表示する。到着した担当職員が「対応を始める」を押して支援する。支援後、本人に再開の希望を確かめて「対応を終えてつづける」を押すと、本人のiPadが同じ工程の作業画面へ戻る。停止通知は確認済みにできる。デモでは職員役が同じ机で待機する。

職員は自分のアカウントで開いた支援画面から操作し、本人はiPadの作業画面を使い続ける。担当者の決定、支援の開始・完了、作業再開を両画面で共有する。同じ呼出しを複数の職員が引き受けようとした場合、サーバーは最初に保存できた職員を担当者とし、ほかの職員には担当済みを返す。担当職員の画面で「対応完了」だけを記録し、本人が自分で「つづける」を選ぶこともできる。

## 支援中のWebSocket連携

`/api/v1/ws`でWebSocket接続を受ける。職員は支援一覧を開いている間、本人は支援待ちの間に接続する。ブラウザは初回メッセージでFirebase IDトークンを渡す。サーバーはトークン・members・Originを検査してから購読を許可する。認証前の接続は5秒で閉じ、トークンをURLやログに残さない。有効期限切れでは切断し、再認証して接続し直す。

職員には同じ所属の支援一覧、本人には自分のセッションと支援状態の変更だけを通知する。本人向け通知には職員メモ・支援記録・プロフィールを含めない。更新操作は上表の認証付きHTTP APIで受け、Firestoreへの保存後に通知する。担当職員が職員用画面で操作すると、本人のiPadは通知された保存済みの状態を表示する。

サーバーは接続直後と再接続時に最新状態を送り直す。ブラウザはセッションと支援要求のrevisionを確認して古い通知を除き、再接続だけでは作業を再開しない。通信断中は支援待ちを保ち、HTTPで3秒ごとに最新状態を確認する。支援終了または画面を閉じたときに不要な接続を閉じる。本人が「やめる」を押した端末では、未送信の停止が残っていても停止表示を維持し、再開通知で作業へ戻さない。サーバーも停止済みセッションの再開を拒否する。

## 共通契約と受入条件

- [APIとエンドポイント](../contracts/api.md)
- [データと状態遷移](../contracts/data-model.md)
- [受入条件・評価の記録](../validation/acceptance.md)
- [設計根拠と限界](../research/sources.md)

## 実装・検証の確認範囲

Cloud Run複数インスタンス間の実接続と通信断時の操作は未検証。 実装状況はフロントマターに記録する。`present`は対応コードが存在するという静的確認であり、全要件の実装完了を示さない。
