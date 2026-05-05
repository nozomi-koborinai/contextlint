---
title: include 模式
description: 通过 include 指定检查目标，及其与 CLI 参数的优先顺序。
---

`include` 字段以 glob 模式指定 contextlint 要检查的 Markdown 文件。

## 基本用法

```json
{
  "include": ["docs/**/*.md"]
}
```

通过此设置，`docs/` 目录下的所有 Markdown 文件都会成为检查目标。

## 多个目录

可以以数组形式指定多个 glob。

```json
{
  "include": ["docs/**/*.md", "specs/**/*.md", "adr/**/*.md"]
}
```

## 默认值

省略 `include` 时的默认值为 `["**/*.md"]`，整个仓库的 Markdown 文件都将作为目标。

## 优先顺序

检查目标的确定遵循以下优先顺序。

1. **CLI 参数**(最高优先) — 直接传入 glob 模式
2. **配置文件的 `include`**
3. **默认值** — `["**/*.md"]`

```bash
# 通过 CLI 参数仅检查 specs/ 下的文件（覆盖 config 中的 include）
npx contextlint "specs/**/*.md"
```

## 排除模式

contextlint 没有独立的 `exclude` 字段。需要排除的路径请使用 glob 的否定模式（`!`）来表达。

```json
{
  "include": ["docs/**/*.md", "!docs/_drafts/**"]
}
```

不匹配 include 的路径会被自动排除，因此通过收紧 include 即可达到与排除等效的行为。

## glob 行为

contextlint 内部使用 [picomatch](https://www.npmjs.com/package/picomatch)，支持 `*`、`**`、`?`、`[abc]` 等标准 glob 语法。

以 dot 开头的目录（`.claude/`、`.github/` 等）也会被匹配。如果希望排除存放 Markdown 文件的 dot-directory，请显式书写否定模式。

```json
{
  "include": ["**/*.md", "!.claude/**", "!.github/**"]
}
```
