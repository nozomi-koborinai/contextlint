---
title: 规则级别的范围限定
description: 通过 files 选项仅对特定文件群应用某条规则。
---

当希望「只对匹配某个 glob 的文件应用特定规则」时，可使用规则的 `files` 选项。

## 基本用法

```json
{
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    }
  ]
}
```

此设置仅对 `decisions/*.md` 应用 SEC-001（必需章节）。其他文件不会成为 SEC-001 的检查对象。

## 语法

`files` 选项接收 glob 模式（单个字符串）。内部会展开为 `**/${files}`，因此只需写相对路径就能匹配深层目录。

```json
{ "rule": "sec001", "options": { "files": "decisions/*.md" } }
```

这等价于 `**/decisions/*.md`，可匹配仓库内任意位置的 `decisions/` 目录。

## 适用场景

- **仅对 ADR 文件夹强制 ADR 模板** — 在 `decisions/*.md` 中将 `Context / Decision / Consequences` 设为必需
- **仅对规格文件夹强制规格模板** — 在 `specs/*.md` 中将 `概览 / API / 示例` 设为必需
- **新建目录从严，遗留目录从宽** — 渐进式地引入完整性检查

## 与 include 的关系

[include](/zh/docs/configuration/include-patterns/) 限定**检查目标的整体范围**。`files` 则在 include 决定的范围内进一步限定**单个规则的应用范围**。两者可以并用。

## 支持的规则

TBL-001 ～ TBL-005、SEC-001、SEC-002、REF-\* 系列、CTX-001、CTX-002 都支持此选项。各规则的详情请参考 [Rules](/zh/docs/rules/)。
