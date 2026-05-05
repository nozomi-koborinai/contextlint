---
title: AI Agents
description: contextlint を AI エージェントから呼び出すための 2 つの統合経路（MCP / Skills）。
---

contextlint は AI エージェントから利用するための 2 つの統合経路を提供しています。Claude Code、Cursor Agent、Cline、Codex、Gemini CLI、GitHub Copilot などのホストから、ドキュメント整合性チェックを会話の中に組み込めます。

## 2 つの統合経路

| 経路 | プロトコル | 主なホスト | 配信形態 |
| --- | --- | --- | --- |
| **MCP サーバー** | Model Context Protocol | Claude Desktop / Cursor / Cline / Codex 等 | `@contextlint/mcp-server` パッケージ |
| **Agent Skills** | [agentskills.io](https://agentskills.io) 仕様 | Claude Code / Cursor Agent / Codex / Gemini CLI / GitHub Copilot 等 | GitHub リポジトリから `gh skill install` |

両者は競合せず、目的に応じて使い分けます。MCP は **AI が contextlint の機能を直接呼び出す** ためのプロトコル、Skills は **AI に「何をしてほしいか」を言葉で伝えるためのワークフロー** です。

## どちらを選ぶか

- **「AI に lint を実行させたい」「ドキュメントグラフを参照させたい」** → [MCP サーバー](/ja/docs/integrations/ai-agents/mcp-server/)
- **「AI に contextlint のセットアップを任せたい」「違反を自動修正させたい」「変更影響を分析させたい」** → [Skills](/ja/docs/integrations/ai-agents/skills/)

ホストが両方に対応している場合（Claude Code など）は併用できます。Skill が内部で MCP ツールを呼び出すこともあります。

## このセクションの構成

- [MCP サーバー](/ja/docs/integrations/ai-agents/mcp-server/) — `@contextlint/mcp-server` のセットアップと提供する 5 つのツール
- [Agent Skills](/ja/docs/integrations/ai-agents/skills/) — `gh skill install` の使い方と対応ホスト一覧
- [contextlint-init Skill](/ja/docs/integrations/ai-agents/skill-init/) — リポジトリへの初期セットアップを任せる
- [contextlint-fix Skill](/ja/docs/integrations/ai-agents/skill-fix/) — 検出された違反の修正を任せる
- [contextlint-impact Skill](/ja/docs/integrations/ai-agents/skill-impact/) — ファイル変更の影響範囲を分析させる

## 関連

- 最短のセットアップ手順は [Quick Start — AI 連携](/ja/docs/get-started/quick-start-ai/) を参照してください。本セクションは各 Skill / ツールの **詳細仕様と使いどころ** を扱います。
