---
title: 配置文件
description: contextlint.config.json 的结构与各字段概览。
---

contextlint 的配置文件命名为 `contextlint.config.json`，放置在仓库根目录下，采用 JSON 格式。

## 最小示例

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    { "rule": "ref001" }
  ]
}
```

## 字段

| 字段 | 类型 | 必需 | 概览 |
|-----------|------|------|------|
| `$schema` | string | 推荐 | 编辑器自动补全用 |
| `include` | string[] | 可选 | 检查目标的 glob 模式。详见 [include 模式](/zh/docs/configuration/include-patterns/) |
| `rules` | object[] | 必需 | 启用规则的数组。各规则的规格请参考 [Rules](/zh/docs/rules/) |

## $schema

指定 `$schema` 后，VS Code / Cursor / JetBrains 等编辑器在编辑配置文件时会启用自动补全和内联校验。如果希望固定到发布版本，请将 URL 中的 `main` 替换为 `v1.0.0` 之类的标签名。

## 校验

配置文件在运行时通过 Zod schema 进行校验。当字段类型不正确，或指定了未知的规则 ID 时，启动时会显示面向用户的错误信息。
