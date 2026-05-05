---
title: 规格驱动开发的仓库
description: 强制需求 → 规格 → 实现的可追溯性与稳定度管理的 contextlint 配置示例。
---

本食谱面向将需求、规格、设计作为 SSOT (Single Source of Truth) 以 Markdown 管理，并由 AI 或工程师据此生成代码的 **规格驱动开发 (SDD: Spec Driven Development)** 实践仓库，提供配置示例。

通过 contextlint 强制需求 ID 的可追溯性、稳定度标签的一致性，以及按区域 (zone) 的责任分界。

## 适用于哪类项目

- 像 `docs/zones/<feature>/` 这样 **按职责单位 (zone) 拆分文档**
- 需求表格拥有 `ID` / `内容` / `安定度` 这类列，并以 `REQ-AUTH-01` 这样的 ID 标识
- 需求 ID 被规格、设计、测试文档反复引用
- 需求按 `draft` → `review` → `stable` 这样的生命周期管理
- 存在让 AI 智能体编辑文档的场景，容易发生引用断裂

本配置以 [contextlint 介绍文章](https://www.koborin.ai/ja/tech/contextlint-introduction/) 中说明的 SDD 分层结构（`foundation/` / `standards/` / `zones/`）为前提，但对于更简单的单层 `docs/specs/` 项目，调整 ID 与 zone 的 glob 即可直接使用。

## 推荐配置 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["docs/**/*.md"],
  "rules": [
    {
      "rule": "tbl001",
      "options": {
        "files": "**/requirements.md",
        "requiredColumns": ["ID", "内容", "安定度"]
      }
    },
    {
      "rule": "tbl002",
      "options": {
        "files": "**/requirements.md",
        "columns": ["ID", "安定度"]
      }
    },
    {
      "rule": "tbl003",
      "options": {
        "files": "**/requirements.md",
        "column": "安定度",
        "values": ["draft", "review", "stable"]
      }
    },
    {
      "rule": "tbl004",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "pattern": "^REQ-[A-Z]+-\\d{2,3}$"
      }
    },
    {
      "rule": "tbl006",
      "options": {
        "files": "**/requirements.md",
        "column": "ID",
        "idPattern": "^REQ-"
      }
    },
    {
      "rule": "sec001",
      "options": {
        "files": "**/requirements.md",
        "sections": ["業務価値", "要件"]
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    {
      "rule": "ref002",
      "options": {
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md", "**/test_*.md"],
        "idColumn": "ID",
        "idPattern": "^REQ-[A-Z]+-\\d+$"
      }
    },
    {
      "rule": "ref003",
      "options": {
        "stabilityColumn": "安定度",
        "stabilityOrder": ["draft", "review", "stable"],
        "definitions": "**/requirements.md",
        "references": ["**/spec_*.md", "**/design_*.md"]
      }
    },
    {
      "rule": "ref004",
      "options": {
        "zonesDir": "docs/zones",
        "dependencySection": "外部Zone連携"
      }
    },
    { "rule": "grp002" },
    {
      "rule": "ctx001",
      "options": {
        "files": "**/zones/**/*.md"
      }
    },
    {
      "rule": "ctx002",
      "options": {
        "glossary": "docs/foundation/glossary.md",
        "termColumn": "用語",
        "aliasColumn": "別名",
        "files": "docs/zones/**/*.md"
      }
    }
  ]
}
```

## 选择各条规则的理由

### TBL 系列 — 保证需求表格的结构

需求表格是 SDD 的核心，结构一旦损坏，后续规则（`ref002` / `ref003` / `grp001` 等）也会全部失去意义。按以下顺序"从外壳到内容"进行保证：

| 规则 | 保证的内容 |
| --- | --- |
| [TBL-001 必需列](/zh/docs/rules/tbl-001/) | 存在 `ID` / `内容` / `安定度` 列 |
| [TBL-002 空单元格](/zh/docs/rules/tbl-002/) | `ID` 与 `安定度` 单元格不为空 |
| [TBL-003 允许值](/zh/docs/rules/tbl-003/) | `安定度` 列为 `draft` / `review` / `stable` 之一 |
| [TBL-004 单元格模式](/zh/docs/rules/tbl-004/) | `ID` 符合 `REQ-AUTH-01` 这样的命名规则 |
| [TBL-006 跨文件 ID 唯一性](/zh/docs/rules/tbl-006/) | 整个项目中需求 ID 唯一 |

`tbl004` 的 `pattern` 形如 `^REQ-[A-Z]+-\\d{2,3}$`，强制包含 zone 名（大写字母）的结构。若使用不含 zone 名的扁平 ID 体系（`REQ-001`），请将 `pattern` 改为 `^REQ-\\d+$`。

### SEC-001 — 业务价值与需求章节的存在

需求文档需要"**为何**有此需求"（业务价值）与"**实现什么**"（需求本体）兼备，才能保证对利益相关方的可解释性。仅写 `業務価値` 而忘记需求表格，或反之的情况都存在，因此机械地强制。

将 [SEC-001 必需章节](/zh/docs/rules/sec-001/) 限定在 `**/requirements.md` 上应用。

### REF-002 — 需求 ID 的跨文件可追溯性

如果需求 ID 没有从规格、设计、测试中被引用，那么该需求可能未抵达实现。反之，如果未定义的 ID 被规格书引用，那则是复制粘贴失误或旧 ID 的残留。用一条规则双向校验可追溯性。

[REF-002 ID 的定义与引用](/zh/docs/rules/ref-002/) 是 **项目作用域** 的规则，从 `include` 对象的所有文档中抽取 ID。在 `references` 中列举 `spec_*.md` / `design_*.md` / `test_*.md`，确认它们各自是否引用了定义侧的需求 ID。

`idPattern` 指定包含 zone 名的严格版本（`^REQ-[A-Z]+-\\d+$`），以避免误把表头行的样例或以 `REQ-` 开头的解说文本当作 ID 拾取。

### REF-003 — 稳定度的一致性

`stable` 的规格书引用了 `draft` 的需求，这种状态意味着"需求尚未确定但规格已经定型"的矛盾。当演示或利益相关方评审导致需求变化时，为了把握其影响波及到规格的范围，维护稳定度的方向性是有价值的。

[REF-003 稳定度一致性](/zh/docs/rules/ref-003/) 比较需求的稳定度与规格侧行（持有的稳定度），将 `stable` → `draft` 这类不一致以 warning 报告。

### REF-004 — 显式化 Zone 间依赖

zone 是责任分界的单位，因此若 `auth` zone 依赖 `payment` zone，就需要明确"`auth` 依赖 `payment`"的设计意图。实现层面物理地写出跨 zone 链接本身是可能的，因此校验该意图是否在 `overview.md` 中已声明。

[REF-004 区域依赖](/zh/docs/rules/ref-004/) 将各 zone 的 `overview.md` 中的 `外部Zone連携` 章节作为依赖声明读取。`dependencySection` 默认为 `Dependencies`，由于是日文文档，因此显式指定 `外部Zone連携`。

### GRP-002 — 防止整体图的循环

由于以引用按需求 → 规格 → 设计 → 测试方向扩散为前提，引用图应当是 DAG。提早检测跨 zone 的循环引用，以及需求与规格双向链接的模式。

采用 [GRP-002 循环引用](/zh/docs/rules/grp-002/)。GRP-001（可追溯性链）是按 ID 单位校验需求 → 规格 → 测试阶段结构的强力规则，但当 zone 与阶段的组合较多时，`chain` 配置会膨胀，因此推荐先用 GRP-002 仅保证有无循环，必要时再追加阶段。

### REF-001 / REF-005 — 保护链接与锚点

跨 zone 的 Markdown 链接、向词汇表 (foundation) 的继承链接、规格书向需求书的引用链接等，SDD 的完整性由无数链接支撑。同时保证文件存在 (REF-001) 与锚点 (REF-005)。

### CTX-001 — 占位符检测（限定在 zone 之下）

为避免 zone 内规格书在残留 `TBD` 或 `TODO` 的情况下变成 `安定度: stable`，将占位符检测限定于 `docs/zones/**/*.md`。不应用于 `foundation/` 或 `standards/` 的文档（这些在初始构建阶段可能含有 TBD）。

将 [CTX-001 占位符检测](/zh/docs/rules/ctx-001/) 用 `files: "**/zones/**/*.md"` 收紧。

### CTX-002 — 与词汇表的一致性

SDD 中将 `foundation/glossary.md` 作为"通用语言"运维，因此校验各 zone 的文档是否使用词汇表的正式表述。AI 生成的草稿容易混入别名 (alias)，确定性的检测在此场景下生效。

[CTX-002 术语一致性](/zh/docs/rules/ctx-002/) 将 glossary.md 的 `用語` 列作为正式表述，`別名` 列作为 alias 引用。glossary.md 假定为以下结构：

```markdown
# 用語集

## 用語

| 用語     | 別名         |
| -------- | ------------ |
| データベース | DB, database |
| 要件     | requirement  |
```

### 本食谱未采用的规则

| 规则 | 不采用的理由 |
| --- | --- |
| SEC-002 | requirements.md 中顺序固定性不强的情形较多（若模板性较强可追加） |
| TBL-005 | TBL-003 / TBL-004 已能充分约束稳定度与 ID。若有"`安定度=stable` 时审批人列必填"等运维则追加 |
| GRP-001 / GRP-003 | zone 与阶段一多，`chain` 配置就会膨胀。等项目稳定后再追加 |
| STR-001 | 像 `docs/foundation/glossary.md` 这类必需化通过 CTX-002 的 `glossary` 指定即可实质性强制 |

## 运维上的注意事项

### 引入到既有仓库

在已有大量 SDD 文档的状态下整体应用本食谱，会因需求 ID 模式违反、zone 依赖声明遗漏而产生大量违反。按以下顺序分阶段引入更为现实：

1. **TBL-001 / TBL-002 / TBL-003 / TBL-004** — 首先固化需求表格的结构
2. **TBL-006** — 解决 ID 重复
3. **REF-001 / REF-005** — 修复链接与锚点
4. **REF-002** — 整理可追溯性违反（warning 阶段性消除）
5. **REF-003 / REF-004 / GRP-002** — 结构性完整性
6. **CTX-001 / CTX-002** — 上下文质量的收尾

每一步分别提交，可使评审与回退更轻松。不要试图一次性消除 warning，推荐先把 error 降为 0 件的运维方式。

### 与 AI 智能体的联动

让 AI 智能体编辑文档时，在编辑后通过 MCP 让其执行 `lint-files`，或用 Claude Code Hooks 自动执行 `npx contextlint`，可让 AI 自身检测并修复违反。详见 [AI Agents 集成](/zh/docs/integrations/ai-agents/)。

### CI 中的门禁

需求、规格的变更通常以 PR 推进，因此用 `pull_request` 触发器以 `docs/**` 作为路径过滤器较为高效。具体的工作流示例请参考 [CI 集成模式](/zh/docs/recipes/ci-integration-patterns/)。

### 追加 chain 校验 (GRP-001)

如果存在需求 → 规格 → 测试计划这样明确的阶段结构，并希望强制各阶段的覆盖度，可追加 GRP-001。届时的 `chain` 配置示例请参考 [GRP-001 可追溯性链](/zh/docs/rules/grp-001/) 页面。
