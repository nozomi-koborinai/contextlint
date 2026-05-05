---
title: 语义 linter 与语法 linter
description: contextlint 是语义 linter,markdownlint 是语法 linter。两者的分工。
---

contextlint 的标语是 "**markdownlint for syntax. contextlint for meaning.**"。这并不意味着我们做了一个与 markdownlint 功能重叠的工具,而是表明两者**承担不同层级,处于互补关系**。本页将梳理语义 linter (semantic linter) 与语法 linter (syntax linter) 的区别。

## 层级的差异

linter 按所验证的对象划分为不同层级。

| 层级 | 验证对象 | 示例 |
|---------|------------|-----|
| **语法 (syntax)** | 写法是否符合文法 | 标题层级、列表写法、表格语法 |
| **格式 (format)** | 写法风格是否统一 | 行尾空格、列表符号统一 |
| **语义 (semantic)** | 内容是否在逻辑上一致 | 必需列的有无、ID 的唯一性、引用目标的存在性 |

markdownlint 负责**语法和格式**。contextlint 负责**语义完整性和文件间完整性**。两者并不冲突,层级不同。

## 功能对比

| 视角                       | markdownlint | contextlint |
| -------------------------- | :----------: | :---------: |
| Markdown 语法              |      ✓       |      —      |
| 格式与样式                 |      ✓       |      —      |
| 标题层级一致性             |      ✓       |      —      |
| 表格语法的正确性           |      ✓       |      —      |
| 表格内的数据完整性         |      —       |      ✓      |
| 必需章节的存在             |      —       |      ✓      |
| 必需章节的顺序             |      —       |      ✓      |
| ID 的唯一性                |      —       |      ✓      |
| 文件间的引用完整性         |      —       |      ✓      |
| 依赖图的验证               |      —       |      ✓      |
| 术语一致性                 |      —       |      ✓      |

## 通过具体示例看差异

对同一张表格,两者验证不同的方面。

```markdown
| ID          | Status | Description |
| ----------- | ------ | ----------- |
| REQ-AUTH-01 |        | 登录需求    |
| REQ-AUTH-01 | stable |              |
```

- **markdownlint** 关注的:管道符的数量、分隔行的格式、空白符的处理 — **表格作为 Markdown 是否有效**
- **contextlint** 关注的:
  - `Status` 列存在空单元格 (TBL-002)
  - `ID` 列存在重复 (TBL-006)
  - `Description` 列存在空单元格 (TBL-002)
  - **表格内容是否在业务上保持完整性**

将两者结合,就能从两个方向覆盖**写法的正确性 + 内容的正确性**。

## 为什么需要语义 linter

仅靠语法 linter 无法覆盖的领域,会随着文档规模的增长而日益显现。

- 链接即使以 Markdown 正确语法编写,**链接目标的文件也可能不存在**
- 表格即使是 Markdown 上正确的语法,**也可能缺失必需列**
- 同一个 ID 即使在多个文件中被定义,**作为 Markdown 也毫无问题**
- 即使稳定 (stable) 的需求依赖于草案 (draft) 状态的需求,**Markdown 语法上也不会报错**

这些是 **Markdown 层级无法检测**的问题。它们不在语法层,而是位于**语义层**,因此需要另一种 linter。

## 搭配使用为前提

contextlint 不会取代 markdownlint。两者搭配使用,才能从多个层级验证文档。

- **markdownlint** — "Markdown 是否写得正确"
- **contextlint** — "文档的内容是否完整一致"

CI 流水线中推荐依次运行两者。markdownlint 验证语法,contextlint 验证语义 — 让各自发挥所长是自然的用法。

## 下一步

- [为什么 contextlint 存在](/zh/docs/concepts/why-contextlint-exists/) — 语义 linter 之所以必要的背景
- [Rules](/zh/docs/rules/) — contextlint 提供的各条规则的规范
