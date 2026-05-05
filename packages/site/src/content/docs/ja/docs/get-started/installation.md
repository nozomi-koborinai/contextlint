---
title: インストール
description: contextlint をプロジェクトにインストールする 2 種類の方法。
---

contextlint は **2 種類のインストール方法** を提供しています。AI ホスト（Claude Code / Cursor / Codex 等）を使っているなら **Skill 経由が最短** です。それ以外は **CLI 経由** で手動セットアップします。

## Skill 経由（推奨）

[agentskills.io](https://agentskills.io) 互換の AI ホストを使っているなら、`gh skill install` 一発で完了します。

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
```

その後、AI に次のように頼むだけです。

> contextlint を設定して

AI がリポジトリの構造を分析し、ドキュメントの配置・スタイル（ADR 形式 / 仕様書形式 / テーブル中心 / 等）を読み取って、プロジェクトに合った `contextlint.config.json` を自動生成します。21 個あるルールから手で選ぶ必要はありません。

**対応する AI ホスト:**

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- その他 [agentskills.io](https://agentskills.io) 仕様に沿ったホスト

**前提:** GitHub CLI (`gh`) がインストール済みであること。未インストールの場合は [GitHub CLI 公式サイト](https://cli.github.com/) を参照してください。

## CLI 経由（手動）

AI ホストを使っていない、または設定を完全に自分で管理したい場合は、`@contextlint/cli` パッケージを直接インストールします。

### パッケージマネージャー別

contextlint は npm レジストリで配信されています。プロジェクトのパッケージマネージャーに合わせて以下のいずれかを実行してください。

```bash
# bun
bun add -D @contextlint/cli

# pnpm
pnpm add -D @contextlint/cli

# yarn
yarn add -D @contextlint/cli

# npm
npm install -D @contextlint/cli
```

開発依存（`-D` または `--save-dev`）として追加することを推奨します。本番ビルドには不要なためです。

### グローバルインストール（任意）

複数プロジェクトで頻繁に使う場合はグローバルインストールも可能です。

```bash
# bun
bun add -g @contextlint/cli

# npm
npm install -g @contextlint/cli
```

ただし、プロジェクトごとに依存バージョンを固定したい場合は **プロジェクト内インストール（`-D`）の方が安全** です。CI 環境でも同じ動作を保証できます。

### 動作確認

インストール後、バージョンを表示できれば成功です。

```bash
npx contextlint --version
```

## 次のステップ

- [Quick Start — AI 連携](/ja/docs/get-started/quick-start-ai/) — Skill から `init` を実行して、最短でセットアップを完了する
- [Quick Start — 手動](/ja/docs/get-started/quick-start-manual/) — `contextlint init` の対話モードで設定ファイルを作る
