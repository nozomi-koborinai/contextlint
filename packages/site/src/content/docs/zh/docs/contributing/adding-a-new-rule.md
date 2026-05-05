---
title: 新增规则
description: 为 contextlint 实现新规则的分步骤流程。
---

本页按步骤介绍向 contextlint 新增规则时的流程,涵盖从 ID 编号到 `schema.json` 更新的全部环节。每条规则放在 `packages/core/src/rules/<rule-id>.ts` 单一文件中,并将 Zod schema 作为选项的单一信息源。

## 1. ID 编号

新增规则首先确定类别,然后在该类别中按 **下一个空闲序号** 取 3 位补零的编号。

| Prefix | 类别 | 检查对象 |
|--------|---------|---------|
| TBL | Table | 表格内容(必需列、空单元格、允许值、模式、跨列约束、跨文件 ID 唯一性) |
| SEC | Section | 章节标题(存在性、顺序) |
| STR | Structure | 项目级文件存在性 |
| REF | Reference | 链接、锚点、ID 引用、稳定性一致性、区域依赖、图片引用 |
| CHK | Checklist | 清单的完成状态 |
| CTX | Context | 内容质量(占位符检测、术语一致性) |
| GRP | Graph | 文档依赖图(可追溯性、循环引用、孤立文档) |

例如向 TBL 类别新增规则时,作为现有 TBL-001~TBL-006 的下一个,编号为 **TBL-007**。

规则 ID 格式为 `<PREFIX>-<3位数字>`(用于文档与日志展示),registry 上的 key 则为小写连写形式 `<prefix><3位数字>`(如 `tbl007`)。

## 2. 创建规则文件

创建 `packages/core/src/rules/<id>.ts`。例如 `TBL-007` 对应 `packages/core/src/rules/tbl-007.ts`。

最小骨架如下。

```typescript
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { globMatch } from "../utils/glob-match.js";

export const tbl007Schema = z.object({
  // 规则特有的选项
  files: z.string().optional(),
}).strict();

export type Tbl007Options = z.infer<typeof tbl007Schema>;

export function tbl007(options: Tbl007Options): Rule {
  const isMatch = options.files ? globMatch(`**/${options.files}`) : null;

  return {
    id: "TBL-007",
    description: "Short English description of what this rule checks",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      // 遍历表格或章节,通过 context.report() 上报违规
    },
  };
}
```

## 3. 定义 Zod schema

每条规则都把 **Zod schema 作为单一信息源**。请勿手写 interface,而是用 `z.infer<typeof xxxSchema>` 推导类型。

- schema 名为 `<prefix><number>Schema`(如 `tbl007Schema`)
- 末尾加上 `.strict()` 以拒绝未知字段
- 若接收正则表达式,使用 `utils/regex-string.ts` 的 `regexString`,在配置加载时检测非法 pattern
- 若规则接收用于文件匹配的 `files?: string` 选项,需遵循变量名 `isMatch`、fallback 为 `null`、前缀使用 `**/${options.files}` 的规约

由于 registry 一侧会执行 `schema.parse(options)`,规则本体内不需要 `as` 强制转换或手动校验。

## 4. 注册到 registry

编辑 `packages/core/src/registry.ts`,注册新规则。

```typescript
import { tbl007, tbl007Schema } from "./rules/tbl-007.js";

const registry = {
  // ... 现有规则 ...
  tbl007: defineRule(tbl007Schema, tbl007),
};
```

`defineRule` 把 schema 与 factory 配对,使其可经由 `resolveRule` 通过 `schema.parse()` 调用。`Zod` 的校验错误会自动转换为面向用户的消息(包含规则名 + 字段路径)。

## 5. 更新 `schema.json`

仓库根目录下的 `schema.json` 是面向 `contextlint.config.json` 编辑器自动补全的 JSON Schema。新增规则后,**必须** 在 `properties.rules.items.oneOf` 中添加对应条目。

条目格式参照现有规则(如 TBL-001)。

```json
{
  "type": "object",
  "description": "TBL-007: Short description.",
  "properties": {
    "rule": { "const": "tbl007" },
    "options": {
      "type": "object",
      "description": "Options for TBL-007.",
      "properties": {
        // 与 Zod schema 对应的字段
      },
      "required": ["..."],
      "additionalProperties": false
    }
  },
  "required": ["rule", "options"],
  "additionalProperties": false
}
```

CI 上 `packages/core/src/schema.test.ts` 会校验 registry 与 `schema.json` 的一致性。漏加条目,或注册被移除后还残留旧条目,都会导致测试失败。

## 6. 添加测试

在与规则文件相同的目录下创建 `<id>.test.ts`(例如 `packages/core/src/rules/tbl-007.test.ts`)。

测试用 `bun:test` 编写,除 **正常情况、违规检出、各选项的行为** 之外,还必须包含 **日语、韩语、中文** 的测试 fixture。CJK 要求的详情请参见 [测试编写](/zh/docs/contributing/writing-tests/)。

## 7. 添加文档

按以下各语言新增并更新面向用户的文档。

- `packages/site/src/content/docs/ja/docs/rules/<id>.md`(日文)
- `packages/site/src/content/docs/en/docs/rules/<id>.md`(英文)
- `packages/site/src/content/docs/ko/docs/rules/<id>.md`(韩文)
- `packages/site/src/content/docs/zh/docs/rules/<id>.md`(中文)

每个规则 page 按以下结构编写。

1. 概述(检测什么)
2. 为什么需要(防止哪些问题)
3. 选项(字段表)
4. 违规示例与修复后(Bad → Good)
5. 配置示例(`contextlint.config.json` 摘录)
6. 相关规则

此外,需要在各语言的 `Rules` 类别索引(各语言的 `rules/index.md`)中添加指向新规则的链接。如果改动影响到 CLI / 配置 / README,仓库根目录下的 `README.md` / `README.ja.md` / `README.zh.md` / `README.ko.md` 也都 **必须** 一起更新。请勿仅更新一种语言。

## 8. 验证

最后在仓库根目录执行以下命令,确认全部通过。

```bash
bun test
bun run --filter '*' typecheck
bun run --filter '*' build
npx eslint .
```

`schema.test.ts` 通过即说明 registry 与 `schema.json` 的一致性也已保持。

## 提交与 Pull Request

按 Conventional Commits 格式提交。新增规则通常使用 `feat:` 前缀。

```text
feat: add TBL-007 rule for <what it validates>
```

每新增 1 条规则,把规则本体、registry 注册、`schema.json` 更新、测试、文档新增整理为 1 个 PR,便于代码评审。

## 相关

- [测试编写](/zh/docs/contributing/writing-tests/) — 测试规约与 CJK 要求
- [Rules](/zh/docs/rules/) — 现有规则一览(可作为实现参考)
