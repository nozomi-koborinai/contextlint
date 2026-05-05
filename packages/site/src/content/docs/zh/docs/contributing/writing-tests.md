---
title: 测试编写
description: contextlint 的测试规约,以及日语、韩语、中文 fixture 必需的原因。
---

contextlint 的测试全部基于 [`bun:test`](https://bun.sh/docs/cli/test) 编写。每条规则都必须配备单元测试,尤其是 **日语、韩语、中文测试 fixture** 已被规约固定为必需项。本页介绍测试文件的放置位置、测试运行器的使用方式,以及 CJK 要求的原因。

## 文件放置

测试文件与规则本体放在同一目录下,采用 `<rule-id>.test.ts` 的命名模式。

```text
packages/core/src/rules/
├── tbl-001.ts
├── tbl-001.test.ts
├── tbl-002.ts
├── tbl-002.test.ts
└── ...
```

构建时 `tsconfig.json` 的设置会将测试文件排除,但 ESLint 与类型检查(`tsconfig.eslint.json`)会将其包含进来。测试代码也需要按与本体代码相同的 strict 设置编写。

## bun:test 的基本用法

`bun:test` 提供 `describe` / `it` / `expect`。常规流程是:把 Markdown 直接以字符串传入,经 `parseDocument` 解析后,再执行 `runRules`。

```typescript
import { describe, it, expect } from "bun:test";
import { parseDocument } from "../parser.js";
import { runRules } from "../rule.js";
import { tbl001 } from "./tbl-001.js";

describe("TBL-001: required columns", () => {
  it("reports no errors when all required columns exist", () => {
    const md = `
| ID | Status |
|----|--------|
| 1  | done   |
`;
    const doc = parseDocument(md);
    const rule = tbl001({ requiredColumns: ["ID", "Status"] });
    const messages = runRules([rule], doc, "test.md");
    expect(messages).toHaveLength(0);
  });
});
```

测试中使用的路径可以是 `"test.md"` 这类虚构字符串。在 `files` 选项的测试中,则需要显式传入希望匹配的路径。

## 应当覆盖的测试视角

每条规则至少应包含以下视角的测试。

- **正常情况** — 不存在违规的 Markdown 中,消息数为 0
- **违规检出** — 存在违规的 Markdown 中,如期输出消息(数量、`ruleId`、`severity`、`message` 主体部分)
- **多个违规** — 同一文件内多个违规可并行检出
- **选项分支** — `section`、`files`、列名指定、允许值列表等各选项,按预期发挥范围限定作用
- **CJK fixture** — 验证日语、韩语、中文的标题、列名、单元格值(详见后述)

## CJK 语言测试 fixture 必需

每条规则都必须配备 **日语、韩语、中文** 的测试 fixture。这是 contextlint 的核心规约。

### 为什么必需

contextlint 处理国际化的 Markdown,因此必须保证含 CJK 字符(中日韩)的列名、章节标题、单元格值与 ID **能被正确解析与比较**。CJK 字符在以下方面与 ASCII 行为可能不同。

- **正规化** — 经过 Unicode 正规化(NFC / NFD)的路径上,合成字符被分解后会无法匹配
- **trim** — 全角空格(U+3000)不会被 ASCII 的 `trim()` 去除
- **正则表达式** — `\w` 与 `\b` 以 ASCII 为前提,在中日韩字符上的行为可能与直觉相悖
- **比较** — 表头或章节名的字符串比较,可能因半角/全角或外形相近的不同字符而失败

仅靠英文测试时,这些问题不会浮现。它们会在 CJK 语言用户把 contextlint 投入生产时才被发现。为防止这种情况,**通过测试来确保规则实现侧采用了不依赖语言的处理方式**,这正是规约的目的。

### 编写方式

为每条规则,按 3 种语言各自的 **正常情况与违规检出** 配对添加测试。以 `tbl-001.test.ts` 为例,大致形态如下。

```typescript
it("validates required columns with Japanese column names", () => {
  const md = `
| ID | 要件 | 安定度 |
|----|------|--------|
| REQ-01 | ユーザー認証 | draft |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  expect(runRules([rule], doc, "test.md")).toHaveLength(0);
});

it("reports missing Japanese column names", () => {
  const md = `
| ID | 要件 |
|----|------|
| REQ-01 | ユーザー認証 |
`;
  const doc = parseDocument(md);
  const rule = tbl001({ requiredColumns: ["ID", "安定度"] });
  const messages = runRules([rule], doc, "test.md");
  expect(messages).toHaveLength(1);
  expect(messages[0].message).toContain("安定度");
});
```

韩语(`요구사항` / `안정성`)与中文(`需求` / `稳定性`)也需添加同样的配对。如果是清单规则或章节规则,则准备把标题或清单条目文案改写为 CJK 的 fixture。

## 运行测试

在仓库根目录执行以下命令,即可一次性运行所有 package 的测试。

```bash
bun test
```

只想针对特定规则运行时,可按文件名进行过滤。

```bash
bun test packages/core/src/rules/tbl-001.test.ts
```

测试通过后,推荐再确认类型检查、构建与 ESLint。

```bash
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

## 相关

- [新增规则](/zh/docs/contributing/adding-a-new-rule/) — 包括测试添加在内的规则实现整体流程
- [开发环境搭建](/zh/docs/contributing/development-setup/) — bun 的安装与命令一览
