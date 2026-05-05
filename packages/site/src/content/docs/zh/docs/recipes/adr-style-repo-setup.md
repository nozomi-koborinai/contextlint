---
title: ADR 风格的仓库
description: 以模板驱动方式运维 Architecture Decision Records 的 contextlint 配置示例。
---

本食谱面向以 **ADR (Architecture Decision Records)** 形式用 Markdown 记录软件架构决策的仓库，提供配置示例。其目标是贯彻 `Context / Decision / Consequences` 这类统一模板，并维持 ADR 之间的相互引用不被破坏。

## 适用于哪类项目

- 将 ADR 集中存放于 `decisions/` 或 `docs/adr/` 这类目录
- 每个 ADR 都拥有 `## Context` / `## Decision` / `## Consequences` 这类共通模板
- ADR 之间以"补充 / 替换"的形式相互引用
- ADR 文件数量增多，模板偏离与引用断裂已无法靠肉眼追踪

对于新引入文档完整性检查的仓库而言，由于 `include` 的对象局限于 `decisions/` 之下，**副作用易于阅读**，这是该配置的优势。

## 推荐配置 (`contextlint.config.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
  "include": ["decisions/**/*.md"],
  "rules": [
    {
      "rule": "sec001",
      "options": {
        "files": "decisions/*.md",
        "sections": ["Context", "Decision", "Consequences"]
      }
    },
    {
      "rule": "sec002",
      "options": {
        "files": "decisions/*.md",
        "order": ["Context", "Decision", "Consequences"],
        "level": 2
      }
    },
    { "rule": "ref001" },
    { "rule": "ref005" },
    { "rule": "grp002" },
    {
      "rule": "tbl003",
      "options": {
        "column": "Status",
        "values": ["proposed", "accepted", "deprecated", "superseded"]
      }
    },
    { "rule": "ctx001" }
  ]
}
```

通过将 `include` 限定在 `decisions/` 之下，可避免对 README 等其他运维文档的误检。`decisions/index.md` 这类目录文件也假定放在同一层级。

## 选择各条规则的理由

### SEC-001 / SEC-002 — 强制模板

ADR 模板不仅"是否存在"重要，"以什么顺序排列"也直接关系到读者的认知成本。如果 `Consequences` 出现在 `Decision` 之前，会变成在阅读结论之前先呈现影响的形式，使文档难以评审。

- 用 [SEC-001 必需章节](/zh/docs/rules/sec-001/) 强制 `Context` / `Decision` / `Consequences` 的存在
- 用 [SEC-002 章节顺序](/zh/docs/rules/sec-002/) 强制排列顺序（`level: 2` 限定为 `##` 级别的标题，忽略正文中其他级别的标题）

通过指定 `files: "decisions/*.md"`，若想仅排除 `decisions/index.md` 或 `decisions/template.md` 这类特殊文件，可单独收紧 glob，或采用建立排除用 subdirectory 的运维方式。

### REF-001 / REF-005 — 保护相互引用

ADR 容易形成"ADR-012 替换 ADR-005"这样相互引用的结构。重命名或删除导致链接断裂时，markdownlint 不会检出，因此需要在文件级别和锚点级别同时校验。

- [REF-001 链接断裂](/zh/docs/rules/ref-001/) — 引用目标文件是否存在
- [REF-005 锚点](/zh/docs/rules/ref-005/) — `#decision` 这类锚点片段是否与标题一致

不引入 REF-005 的配置也很常见，但在 ADR 中"请阅读 `ADR-012#decision`"这类深度链接频繁出现，因此本配置采用了它。

### GRP-002 — 防止 supersede 关系的循环

"ADR-012 替换 ADR-005，ADR-018 又替换 ADR-012"这样的链是健全的，但若过度书写文件间的双向链接，结果可能形成 A → B → A 这样的 **循环引用**。循环引用也会破坏 GRP-001（可追溯性链）和 GRP-003（孤立文档），因此提早检出是有价值的。

- [GRP-002 循环引用](/zh/docs/rules/grp-002/) — 保证链接图是 DAG

ADR 因为具有按时间顺序的替换关系，本就应当是 DAG。

### TBL-003 — Status 值的约束

许多团队的 ADR `Status` 列以 `proposed` / `accepted` / `deprecated` / `superseded` 这 4 个值运维。若模板上仅写示例而实际规则隐含化，`approved` / `done` / `WIP` 等自定义值会随时间混入。

- [TBL-003 允许值](/zh/docs/rules/tbl-003/) — 将 `Status` 列的值固定为 4 种

本食谱以 ADR"在头部含元信息表格"的结构（即拥有 `Status` 列的横向表格，而非 `| Status | accepted |` 这样的纵向表格）为前提。若使用纵向表格，可去掉 TBL-003，改用 TBL-005 表达"`Field` 为 `Status` 的行其 `Value` 必须包含在允许列表中"这样的列间约束。

### CTX-001 — 检测 TBD / TODO

ADR 是决策的 **记录**，不是工作中的草稿，因此不会在 `accepted` 状态下还残留 `TBD` 或 `TODO`。机械地检出正文中是否残留未确定之处。

- [CTX-001 占位符检测](/zh/docs/rules/ctx-001/) — 检出 `TBD` / `TODO` / `WIP` 等的残留

若希望"在 `proposed` 阶段允许 `TBD`"，可用 `section` 选项限定目标章节，或将 `proposed` 文件单独放在另一个目录（`decisions/draft/`）并从 include 中排除。

### 本食谱未采用的规则

| 规则 | 不采用的理由 |
| --- | --- |
| TBL-001 / TBL-002 / TBL-004 / TBL-006 | ADR 以正文为中心，对 ID 表格的结构校验重要度较低 |
| REF-002 / REF-003 / GRP-001 | 不用于管理需求 → 规格 → 实现的链 |
| CTX-002 | 在不持有词汇表 (glossary) 的纯 ADR 仓库中过度 |
| REF-004 | ADR 多数情况下不进行 zone 划分 |
| STR-001 | 多数团队不依赖单一 `decisions/index.md`，而以 README 为中心运维 |

如果在同一仓库中同时运维 ADR 与规格书，则 CTX-002 与 REF-004 是值得采用的规则。这种情况下请参考 [规格驱动开发的仓库](/zh/docs/recipes/spec-driven-development-setup/) 食谱。

## 运维上的注意事项

### 引入到既有仓库

如果在已有数十份 ADR 的状态下整体应用本食谱，初次执行可能产生大量 violation。按以下顺序分阶段引入更为现实：

1. **仅启用 `ref001`**，先修复链接断裂
2. **`sec001` 排除 `proposed` 后阶段性应用** — 制作一个修正既有 ADR 模板偏离的提交
3. **追加 `sec002`** — 仅修正顺序错位
4. **追加 `tbl003`** — 整理 Status 值
5. **追加 `grp002` / `ctx001` / `ref005`** — 剩余的结构性完整性

如果想按文件排除，可在 `include` 中使用 `!decisions/legacy/**` 这样的否定模式，或将旧版 ADR 移到 `decisions/archive/` 这样的另一个目录并从 include 中排除。

### CI 中的门禁

ADR 通常基于 PR 增删改，因此用 `pull_request` 触发器配上 `decisions/**` 的路径过滤器可避免无谓的执行。具体的工作流示例请参考 [CI 集成模式](/zh/docs/recipes/ci-integration-patterns/)。

### 排除模板文件

若放置 `decisions/template.md` 这类格式模板，为通过 SEC-001 / SEC-002 检查，会变成一个仅排列着无实质内容的章节标题的文件。

- 推荐：将 `decisions/template.md` 改为 `decisions/_template.md`，把 `include` 改为 `decisions/[!_]*.md`
- 替代方案：将模板移至另一个目录（`docs/templates/`）

`include` 的 glob 是 picomatch，可通过否定字符类（`[!_]`）排除以 `_` 开头的文件。详见 [include 模式](/zh/docs/configuration/include-patterns/)。
