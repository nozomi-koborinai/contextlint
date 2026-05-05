---
title: Rules
description: contextlint 的 21 个规则参考。
---

contextlint 提供 **21 个规则**,分为 7 个类别。每个规则通过 ID 在 `contextlint.config.json` 的 `rules` 数组中注册。

## 类别

| Prefix | 类别 | 验证的内容 |
|--------|------|------------|
| **TBL** | Table | 表格内容:必需列、空单元格、允许值、模式、列间约束、文件间 ID 唯一性 |
| **SEC** | Section | 章节标题的存在与顺序 |
| **STR** | Structure | 项目级文件存在 |
| **REF** | Reference | 链接、锚点、文件间 ID 引用、稳定度一致性、区域依赖、图片引用 |
| **CHK** | Checklist | 清单的完成状态 |
| **CTX** | Context | 占位符检测、术语一致性 |
| **GRP** | Graph | 文档依赖图:可追溯链、循环引用、孤立文档 |

## 全部 21 个规则

### TBL — 表格 (6)

- [TBL-001 必需列](/zh/docs/rules/tbl-001/)
- [TBL-002 空单元格](/zh/docs/rules/tbl-002/)
- [TBL-003 允许值](/zh/docs/rules/tbl-003/)
- [TBL-004 单元格模式](/zh/docs/rules/tbl-004/)
- [TBL-005 列间约束](/zh/docs/rules/tbl-005/)
- [TBL-006 文件间 ID 唯一性](/zh/docs/rules/tbl-006/)

### SEC — 章节 (2)

- [SEC-001 必需章节](/zh/docs/rules/sec-001/)
- [SEC-002 章节顺序](/zh/docs/rules/sec-002/)

### STR — 结构 (1)

- [STR-001 文件存在](/zh/docs/rules/str-001/)

### REF — 引用 (6)

- [REF-001 链接断裂](/zh/docs/rules/ref-001/)
- [REF-002 ID 的定义与引用](/zh/docs/rules/ref-002/)
- [REF-003 稳定度一致性](/zh/docs/rules/ref-003/)
- [REF-004 区域依赖](/zh/docs/rules/ref-004/)
- [REF-005 锚点](/zh/docs/rules/ref-005/)
- [REF-006 图片引用](/zh/docs/rules/ref-006/)

### CHK — 清单 (1)

- [CHK-001 未完成项目](/zh/docs/rules/chk-001/)

### CTX — 上下文质量 (2)

- [CTX-001 占位符检测](/zh/docs/rules/ctx-001/)
- [CTX-002 术语一致性](/zh/docs/rules/ctx-002/)

### GRP — 图 (3)

- [GRP-001 可追溯链](/zh/docs/rules/grp-001/)
- [GRP-002 循环引用](/zh/docs/rules/grp-002/)
- [GRP-003 孤立文档](/zh/docs/rules/grp-003/)

## 各规则 page 的结构

1. **概述** — 检测什么
2. **为什么需要** — 防止哪类问题
3. **选项** — 可配置的字段
4. **违例与修正后** — Bad → Good
5. **相关规则**

## 配置方法

每个规则在 `contextlint.config.json` 的 `rules` 数组中注册。

```json
{
  "rules": [
    { "rule": "tbl001", "options": { "requiredColumns": ["ID", "Status"] } },
    { "rule": "ref001" }
  ]
}
```

规则 ID 采用 `<prefix><number>` 格式(3 位补零)。详情请参阅 [Configuration](/zh/docs/configuration/)。
