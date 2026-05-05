---
title: Integrations
description: contextlint をエディタ・AI ツール・CI に組み込むための統合方法。
---

contextlint は単体の CLI として動くだけでなく、開発フローの 3 つのレイヤー（編集中・AI 経由・CI）にそれぞれ組み込めます。このカテゴリでは、各統合先のセットアップ方法と挙動を解説します。

## 統合のレイヤー

| レイヤー | 統合先 | フィードバックのタイミング |
| --- | --- | --- |
| 編集中 | エディタ（LSP） | 保存・入力のたびに即時 |
| AI 経由 | AI ツール（MCP / Skills） | AI がドキュメントを操作する際 |
| 実行時 | CLI | 手動実行 / watch モード |
| マージ前 | CI/CD | PR / push のタイミング |

それぞれ独立して動作するため、目的に応じて必要なものだけを採用できます。

## このカテゴリの構成

- [CLI](/ja/docs/integrations/cli/) — `contextlint` コマンド、サブコマンド、フラグ、watch モード、JSON 出力
- [Editors (LSP)](/ja/docs/integrations/editors/) — Language Server Protocol によるエディタ統合
- [AI Agents](/ja/docs/integrations/ai-agents/) — MCP サーバーと Agent Skills
- [CI/CD](/ja/docs/integrations/ci-cd/) — GitHub Actions と JSON 出力を使ったパイプライン連携
