---
title: Agent Skills
description: agentskills.io 互換ホストから contextlint を呼び出すための Skill 一覧と gh skill install の使い方。
---

contextlint は [agentskills.io](https://agentskills.io) 仕様に沿った 3 つの Skill を公開しています。Skill は AI に「何をしてほしいか」を伝える単位で、内部的にコマンド実行・ファイル走査・推論を組み合わせたワークフローを記述しています。AI ホスト側で Skill を起動すると、人間が手順を逐一指示しなくても期待する成果が得られます。

## 提供している Skill

| Skill | 用途 | 詳細 |
| --- | --- | --- |
| `contextlint-init` | リポジトリへの初期セットアップ。doc 構造を scan、ルール推論、CLI install まで | [contextlint-init](/ja/docs/integrations/ai-agents/skill-init/) |
| `contextlint-fix` | 検出された違反を機械的修正と手動確認の両方で解決 | [contextlint-fix](/ja/docs/integrations/ai-agents/skill-fix/) |
| `contextlint-impact` | Context Graph を使ったファイル変更の影響範囲分析 | [contextlint-impact](/ja/docs/integrations/ai-agents/skill-impact/) |

## インストール

GitHub CLI v2.90 以降が必要です。未インストールの場合は [GitHub CLI 公式サイト](https://cli.github.com/) を参照してください。

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
gh skill install nozomi-koborinai/contextlint contextlint-fix
gh skill install nozomi-koborinai/contextlint contextlint-impact
```

最初は `contextlint-init` だけで十分です。`init` がリポジトリのセットアップを終えたあと、必要に応じて `fix` や `impact` を追加してください。

## 構文

```
gh skill install OWNER/REPO SKILL
gh skill install OWNER/REPO SKILL@VERSION
gh skill install OWNER/REPO SKILL --agent claude-code --scope user
```

| オプション | 概要 |
| --- | --- |
| `OWNER/REPO` | Skill を公開している GitHub リポジトリ |
| `SKILL` | リポジトリ内の `skills/<name>/SKILL.md` の `<name>` 部分 |
| `@VERSION` | バージョンタグ（任意） |
| `--agent` | 対象ホスト（`claude-code` など、ホストごとに異なる） |
| `--scope` | `user`（ユーザー全体）/ `repo`（リポジトリのみ） |

その他に `gh skill update`、`gh skill search`、`gh skill publish` が利用できます。

## 対応ホスト

agentskills.io 仕様に対応しているホストであれば、同じ Skill が動作します。

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- その他 [agentskills.io](https://agentskills.io) 仕様に沿ったホスト

ホストごとの登録手順や対応バージョンは agentskills.io と各ホストのドキュメントを参照してください。

## Skill の起動方法

Skill はインストール後、AI ホストに「やってほしいこと」を伝えるだけで自動的に呼び出されます。Skill 名を直接指定する必要はありません。

たとえば次のような依頼で `contextlint-init` が起動します。

> contextlint を設定して
>
> Markdown のリンターを入れたい
>
> ドキュメントの整合性チェックを導入して

`contextlint-fix` は「lint 直して」「壊れたリンク直して」「contextlint がエラー出してる」などの依頼で、`contextlint-impact` は「design.md 変えたら何壊れる？」「この doc 削除して大丈夫？」などの依頼で起動します。各 Skill の起動条件と挙動の詳細は、それぞれの個別ページで解説しています。

## MCP サーバーとの違い

| 観点 | Skills | [MCP サーバー](/ja/docs/integrations/ai-agents/mcp-server/) |
| --- | --- | --- |
| 抽象度 | 高い（ワークフロー単位） | 低い（ツール単位） |
| AI への伝え方 | 自然言語の依頼 | ツール呼び出し |
| 配信 | GitHub リポジトリの `skills/<name>/SKILL.md` | npm パッケージ |
| プロジェクト固有設定 | 不要（Skill が自動推論） | `contextlint.config.json` が必要 |

両者は併用できます。`contextlint-fix` Skill は内部で MCP の `lint` ツールが利用可能ならそちらを優先するなど、Skills と MCP は相互補完的に動作します。

## なぜ Skill 経由を推奨するか

contextlint は 21 個のルールと 7 つのカテゴリを持っています。手で全部読んで適切な構成を選ぶ作業は重いため、`contextlint-init` Skill が **リポジトリの実態を見て構成を提案** する流れにしています。人間は最終確認だけを行えば良く、初期セットアップにかかる労力が大幅に減ります。
