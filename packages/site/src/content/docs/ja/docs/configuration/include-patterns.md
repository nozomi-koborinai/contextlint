---
title: include パターン
description: include による検証対象の指定と、CLI 引数との優先順位。
---

`include` フィールドは contextlint が検証する Markdown ファイルを glob パターンで指定します。

## 基本

```json
{
  "include": ["docs/**/*.md"]
}
```

この指定で、`docs/` ディレクトリ以下のすべての Markdown ファイルが検証対象になります。

## 複数のディレクトリ

複数の glob を配列で指定できます。

```json
{
  "include": ["docs/**/*.md", "specs/**/*.md", "adr/**/*.md"]
}
```

## デフォルト

`include` を省略した場合のデフォルトは `["**/*.md"]` です。リポジトリ全体の Markdown ファイルが対象になります。

## 優先順位

検証対象の決定には次の優先順位があります。

1. **CLI 引数**（最優先） — 直接 glob パターンを渡す
2. **設定ファイルの `include`**
3. **デフォルト** — `["**/*.md"]`

```bash
# CLI 引数で specs/ 配下だけ検証（config の include を上書き）
npx contextlint "specs/**/*.md"
```

## 除外パターン

contextlint には独立した `exclude` フィールドはありません。除外したいパスは glob の否定パターン（`!`）で表現します。

```json
{
  "include": ["docs/**/*.md", "!docs/_drafts/**"]
}
```

include に該当しないパスは自動で除外されるので、include を絞ることで実質的に除外と同等の挙動になります。

## glob の挙動

contextlint は内部で [picomatch](https://www.npmjs.com/package/picomatch) を使っています。`*`、`**`、`?`、`[abc]` などの標準的な glob 構文がサポートされます。

dot から始まるディレクトリ（`.claude/`、`.github/` など）も match します。Markdown ファイルを置いている dot-directory を除外したい場合は明示的に否定パターンを書いてください。

```json
{
  "include": ["**/*.md", "!.claude/**", "!.github/**"]
}
```
