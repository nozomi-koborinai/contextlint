# contextlint

構造化されたMarkdownドキュメントのためのルールベースのリンター。

## なぜ contextlint なのか？

AI主導の開発が主流になりつつある現代、仕様書をまずMarkdownで書き、それを元にAIが実装を生成する「SDD（Spec Driven Development：仕様駆動開発）」のような手法が注目を集めています。プロジェクトがドキュメント駆動のワークフローを採用するにつれ、要件定義、設計の意思決定、API仕様、ADR（Architecture Decision Records：アーキテクチャ決定記録）、RFC（Request for Comments：コメント要請）など、互いに関連し合うMarkdownファイルの数は増大していきます。

これらのドキュメントは、互いに依存関係を持つグラフを形成します。あるIDが別のIDを参照し、ファイル間がリンクされ、ステータスの安定性が下流へと伝播していきます。このグラフが崩れたとき（要件の削除、IDのタイポ、セクションの欠落など）、その影響は表面化しにくいものです。また、LLM（大規模言語モデル）によるレビューは本質的に非決定的であるため、構造的な不整合を検出する手段をLLMだけに頼るには限界があります。

contextlintは、構造化されたMarkdownに対して**決定論的な静的検証**を提供します。リンク切れ、重複ID、セクションの不足、構造上の問題を数秒でキャッチします。AIを使わないためコストはかからず、CI（継続的インテグレーション）との相性も抜群です。

### contextlintがチェックすること（と、しないこと）

contextlintは**コンテンツの意味的な整合性**や**ファイル間の整合性**に特化しています。Markdownの構文、フォーマット、スタイルについては、contextlintと併せて[markdownlint](https://github.com/DavidAnson/markdownlint)を使用してください。これらは互いに補完し合う関係にあります。

| 検証ドメイン | ツール |
|--------|------|
| テーブルのフォーマット、見出しのスタイル、行の長さ | markdownlint |
| テーブルの内容（ID、必須カラム、値の検証） | contextlint |
| Markdownの構文とスタイル | markdownlint |
| ファイルをまたぐ参照、トレーサビリティ、リンクの整合性 | contextlint |
| セクションの網羅性、ファイル構造 | contextlint |

## インストール

```bash
npm install -D @contextlint/cli
```

または、インストールせずに実行することも可能です：

```bash
npx @contextlint/cli --config contextlint.config.json "docs/**/*.md"
```

## パッケージ構成

| パッケージ | 説明 |
|---------|-------------|
| `@contextlint/core` | ルールエンジンとMarkdownパーサー |
| `@contextlint/cli` | CLIエントリーポイント（`contextlint`コマンド） |
| `@contextlint/mcp-server` | AIツール連携用のMCPサーバー |
| `@contextlint/preset-dna` | [software-dna-template](https://github.com/nozomi-koborinai/software-dna-template)用のプリセットルール |

## 使い方

### 設定ファイルを使用する場合

```bash
contextlint --config contextlint.config.json "docs/**/*.md"
```

`contextlint.config.json` の設定例：

```jsonc
{
  "rules": [
    // TBL-001: テーブルに必須カラムが存在すること
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status", "Description"] } },

    // TBL-002: キーとなるカラムに空のセルがないこと
    { "rule": "tbl002", "options": { "columns": ["ID", "Status"] } },

    // TBL-003: カラムの値が許可されたセット内にあること
    { "rule": "tbl003", "options": { "column": "Status", "values": ["draft", "review", "stable"] } },

    // TBL-004: セルの値が正規表現パターンにマッチすること
    { "rule": "tbl004", "options": { "column": "ID", "pattern": "^[A-Z]+-[A-Z]+-\\d{2}$" } },

    // TBL-006: 指定された全ファイル間でIDがユニーク（一意）であること
    { "rule": "tbl006", "options": { "files": "**/requirements.md", "column": "ID" } },

    // SEC-001: ドキュメント内に必須セクションが存在すること
    { "rule": "sec001", "options": { "sections": ["Overview", "Requirements"], "files": "**/overview.md" } },

    // STR-001: プロジェクト内に必須ファイルが存在すること
    { "rule": "str001", "options": { "files": ["docs/overview.md", "docs/requirements.md"] } },

    // REF-001: 相対パスのMarkdownリンクが実在するファイルを指していること
    { "rule": "ref001" },

    // REF-002: 定義されたIDが参照されていること、また参照されているIDが実在すること
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/design.md", "**/overview.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-"
      }
    },

    // REF-003: 依存先アイテムの安定性（Status）を上回る安定性を持っていないこと
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "Status",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/design.md"]
      }
    },

    // REF-004: ゾーンをまたぐリンクが、そのゾーンの概要（overview）で宣言されていること
    { "rule": "ref004", "options": { "zonesDir": "docs/zones" } }
  ]
}
```

### プリセットを使用する場合

プリセットを使用すると、対象のリポジトリに設定ファイルを置かずに済みます。

```bash
contextlint --preset dna --cwd /path/to/project "docs/**/*.md"
```

利用可能なプリセット：

| プリセット | 説明 |
|--------|-------------|
| `dna` | [software-dna-template](https://github.com/nozomi-koborinai/software-dna-template)プロジェクトのヘルスチェック用 |

### CI（GitHub Actions）での利用

```yaml
- run: npx @contextlint/cli --config contextlint.config.json "docs/**/*.md"
```

### MCPサーバーとして利用

contextlintは[MCP](https://modelcontextprotocol.io/)（Model Context Protocol）サーバーとして動作し、ClaudeやCursorなどのAIツールが対話中にMarkdownドキュメントをチェックできるようになります。

```bash
npm install -D @contextlint/mcp-server
```

`mcp.json`（例：`.cursor/mcp.json` や `claude_desktop_config.json`）に追加します：

```json
{
  "mcpServers": {
    "contextlint": {
      "command": "npx",
      "args": ["@contextlint/mcp-server"]
    }
  }
}
```

利用可能なツール：

| ツール | 説明 |
|------|-------------|
| `lint` | 指定されたルールでMarkdownコンテンツを直接チェックする |
| `lint-files` | 設定ファイルやプリセットを使用して、パターンに一致するファイルをチェックする |

## ルール詳細

### テーブルに関するルール

| ID | 説明 | 設定項目 |
|----|-------------|--------|
| TBL-001 | テーブルに必須カラムが存在すること | `requiredColumns` |
| TBL-002 | 主要なカラムに空のセルがないこと | `columns` |
| TBL-003 | カラムの値が指定のセットに含まれること | `column`, `values` |
| TBL-004 | セルの値が正規表現にマッチすること | `column`, `pattern` |
| TBL-006 | 指定ファイル間でIDがユニークであること | `files`, `column`, `idPattern` |

### セクション / 構造に関するルール

| ID | 説明 | 設定項目 |
|----|-------------|--------|
| SEC-001 | ドキュメント内に必須セクションが存在すること | `sections`, `files`（任意） |
| STR-001 | プロジェクト内に必須ファイルが存在すること | `files` |

### 参照に関するルール

| ID | 説明 | 設定項目 |
|----|-------------|--------|
| REF-001 | Markdownのリンク先が実在すること | — |
| REF-002 | IDの定義と参照の整合性が取れていること | `definitions`, `references`, `idColumn`, `idPattern` |
| REF-003 | 依存関係における安定性の順序が守られていること | `stabilityColumn`, `stabilityOrder`, `definitions`, `references` |
| REF-004 | ゾーン間リンクが概要ファイルで宣言されていること | `zonesDir`, `dependencySection` |

### ユースケース

これらのルールは汎用的に設計されています。

- **SDD（仕様駆動開発）** — 仕様書が既存の要件を参照しているか、ファイル間でIDに矛盾がないかを検証する
- **ADR（アーキテクチャ決定記録）** — すべてのADRに必須セクション（Status、Context、Decision）が含まれているか、ステータスの遷移が正しいかをチェックする
- **RFC（コメント要請）** — RFCドキュメントに必要な見出しが含まれているか、提案間の相互参照が壊れていないかを確認する
- **あらゆる構造化Markdownプロジェクト** — CIでリンク切れ、重複ID、ファイルの不足などを自動的に検出する

## ライセンス

MIT
