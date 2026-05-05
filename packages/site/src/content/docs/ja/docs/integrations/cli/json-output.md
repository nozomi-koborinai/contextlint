---
title: JSON 出力
description: --format json による機械可読な出力形式と CI での活用例。
---

`--format json` を指定すると、contextlint は人間向けのテキストではなく、機械可読な JSON を標準出力へ書き出します。CI でのアノテーション生成、エディタ拡張のフィードバック、独自のレポーティングツールへの取り込みなどに使います。

## 基本

```bash
npx contextlint --format json
```

## 出力形式

`lint`（デフォルト）サブコマンドの JSON 出力は、違反のフラットな配列です。

```json
[
  {
    "file": "docs/requirements.md",
    "line": 12,
    "severity": "error",
    "message": "Required column \"Status\" not found in table",
    "ruleId": "TBL-001"
  },
  {
    "file": "docs/design.md",
    "line": 24,
    "severity": "warning",
    "message": "Empty cell in column \"Status\"",
    "ruleId": "TBL-002"
  }
]
```

各要素のフィールドは次のとおりです。

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `file` | string | 違反が見つかったファイルの相対パス |
| `line` | number | 違反箇所の行番号（1 始まり） |
| `severity` | `"error"` / `"warning"` | 重要度 |
| `message` | string | 違反の説明 |
| `ruleId` | string | ハイフン付きのルール ID（例: `TBL-001`） |

違反がない場合は空配列 `[]` が出力されます。

## CI での活用

JSON 出力は GitHub Actions のアノテーションや、Slack / Discord 通知のペイロード生成に使えます。

### 内蔵の GitHub Actions

リポジトリ同梱の Composite Action は `--format json` で contextlint を実行し、結果を PR のインラインアノテーションに変換します。設定例は [CI/CD → GitHub Actions](/ja/docs/integrations/ci-cd/) を参照してください。

### 自前のスクリプトで処理する

`jq` などで違反数を集計するシンプルな例です。

```bash
npx contextlint --format json | jq 'length'
# => 2
```

ルール別に件数を出すことも可能です。

```bash
npx contextlint --format json | jq 'group_by(.ruleId) | map({rule: .[0].ruleId, count: length})'
```

## グラフ系サブコマンドの JSON 出力

`impact` / `slice` / `graph` も `--format json` を受け付けますが、出力構造は lint とは異なります。それぞれのサブコマンドの出力例は [Concepts](/ja/docs/concepts/) を参照してください。
