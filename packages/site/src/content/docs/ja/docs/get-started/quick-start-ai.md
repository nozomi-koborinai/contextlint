---
title: Quick Start — AI 連携
description: Claude Code / Cursor / Codex などの AI ホストから、contextlint を最短でセットアップする。
---

[agentskills.io](https://agentskills.io) 互換の AI ホストを使っているなら、Skill 経由が最短です。3 ステップで lint 実行までたどり着けます。

## 1. Skill をインストールする

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

`contextlint-init` Skill が AI ホストの利用可能なスキルとして登録されます。同じ要領で `contextlint-fix` や `contextlint-impact` もインストールできますが、最初は `contextlint-init` だけで十分です。

## 2. AI に設定を頼む

AI ホストを開いて、現在のリポジトリで次のように頼みます。

> contextlint を設定して

AI が `contextlint-init` Skill を起動し、以下を順に行います。

1. リポジトリ内のドキュメントの場所を検出（`docs/` だけでなく `specs/`, `adr/`, `decisions/` なども）
2. ドキュメントスタイルを推論（ADR 形式 / 仕様書形式 / テーブル中心 / プレースホルダ多用 など）
3. プロジェクトに合うルール構成を提案
4. 確認後、`@contextlint/cli` をインストールし、`contextlint.config.json` を生成

人間が 21 個のルールから手で選ぶ必要はありません。

## 3. lint を実行する

設定ファイルが書けたら、AI が初回の lint を自動で走らせて結果を表示します。違反が出ていれば、続けて `contextlint-fix` Skill で修正候補を提案させることもできます。

手動で実行したい場合は次のコマンドで同じ結果が得られます。

```bash
npx contextlint
```

これで AI 連携セットアップは完了です。

## 対応する AI ホスト

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- その他 [agentskills.io](https://agentskills.io) 仕様に沿ったホスト

## 次のステップ

- [はじめての lint 実行](/ja/docs/get-started/your-first-lint/) — lint の出力の読み方と、よくある違反パターン
- 手動でセットアップしたい場合は [Quick Start — 手動](/ja/docs/get-started/quick-start-manual/)
