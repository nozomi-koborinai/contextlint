# contextlint

<p align="center">
  <img src="assets/hero.png" alt="contextlint — Markdown Document Integrity Linter" width="800">
</p>

[![npm version](https://img.shields.io/npm/v/@contextlint/cli.svg)](https://www.npmjs.com/package/@contextlint/cli)
[![cli downloads](https://img.shields.io/npm/dm/@contextlint/cli.svg?label=cli%20downloads)](https://www.npmjs.com/package/@contextlint/cli)
[![mcp-server downloads](https://img.shields.io/npm/dm/@contextlint/mcp-server.svg?label=mcp-server%20downloads)](https://www.npmjs.com/package/@contextlint/mcp-server)
[![lsp-server downloads](https://img.shields.io/npm/dm/@contextlint/lsp-server.svg?label=lsp-server%20downloads)](https://www.npmjs.com/package/@contextlint/lsp-server)
[![CI](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml/badge.svg)](https://github.com/nozomi-koborinai/contextlint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

面向结构化 Markdown 文档的规则型 linter。
确定性地、数秒内、CI 友好地检测断链、ID 重复、章节缺失以及结构性问题。

> 📚 完整参考与指南: **<https://contextlint.dev>**

## 为什么需要 contextlint？

在 AI 驱动的工作流（如 SDD：Spec Driven Development）中，Markdown 文档形成
依赖关系图：需求引用 ID、设计文档链接到规范、ADR 互相引用。当这张图悄然
失效（需求被删除、ID 拼写错误、章节缺失），后果只在阅读时才浮现。

contextlint 为结构化 Markdown 提供
**确定性的静态校验**。无需 AI、零成本、CI 友好。

> contextlint 关注 **内容语义与跨文件完整性**。Markdown 的 syntax /
> formatting / style 建议与 [markdownlint](https://github.com/DavidAnson/markdownlint)
> 配合使用。两者互补。

## 快速开始

**AI 辅助安装（推荐）** — 适用于 Claude Code、Cursor、Codex、Gemini CLI、
GitHub Copilot 以及任何 [Agent Skills](https://agentskills.io) 兼容客户端。
需要 GitHub CLI **v2.90 及以上**：

```sh
gh skill install nozomi-koborinai/contextlint contextlint-init
```

随后让你的 Agent「设置 contextlint」。
Skill 会检测仓库布局、推断规则、安装 CLI 并生成
`contextlint.config.json`。

**手动安装**：

```bash
npm install -D @contextlint/cli
npx contextlint init
npx contextlint
```

输出示例：

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

## 规则

contextlint 提供 **21 条规则**，分为 7 个类别：

| Prefix | 类别 | 检测内容 | 数量 |
| --- | --- | --- | --- |
| TBL | Table | 必填列、空单元格、允许值、模式、列间约束、跨文件 ID 唯一性 | 6 |
| SEC | Section | 章节标题的存在与顺序 | 2 |
| STR | Structure | 项目级文件存在 | 1 |
| REF | Reference | 链接、锚点、ID 引用、Stability 一致性、Zone 依赖、图片引用 | 6 |
| CHK | Checklist | 任务清单项的完成状态 | 1 |
| CTX | Context | 占位符检测、术语一致性 | 2 |
| GRP | Graph | 可追踪链、循环引用、孤立文档 | 3 |

各规则详情请参见 [Rules](https://contextlint.dev/zh/docs/rules/)。

## 进一步了解

`lint` 之外的命令（`init`、`impact`、`slice`、`graph`、`compile`、
`--watch`）可通过 `npx contextlint --help` 查询。详情请参考以下文档：

| 主题 | 链接 |
| --- | --- |
| Get Started | <https://contextlint.dev/zh/docs/get-started/> |
| 配置参考 | <https://contextlint.dev/zh/docs/configuration/> |
| 规则参考（21 条） | <https://contextlint.dev/zh/docs/rules/> |
| CLI 命令与参数 | <https://contextlint.dev/zh/docs/integrations/cli/> |
| 编辑器集成（LSP） | <https://contextlint.dev/zh/docs/integrations/editors/> |
| AI Agent（MCP、Agent Skills） | <https://contextlint.dev/zh/docs/integrations/ai-agents/> |
| CI/CD 集成 | <https://contextlint.dev/zh/docs/integrations/ci-cd/> |
| Recipes（ADR / SDD / monorepo） | <https://contextlint.dev/zh/docs/recipes/> |
| Graph API（程序化使用） | <https://contextlint.dev/zh/docs/graph-api/> |

## 包结构

| 包名 | 说明 |
| --- | --- |
| `@contextlint/core` | 规则引擎和 Markdown 解析器 |
| `@contextlint/cli` | CLI 入口（`contextlint` 命令） |
| `@contextlint/mcp-server` | AI 工具集成的 MCP 服务器 |
| `@contextlint/lsp-server` | Language Server Protocol 实现 |
| `contextlint-vscode` | VS Code / Cursor 扩展 — Marketplace 上线之前请从 [GitHub Releases](https://github.com/nozomi-koborinai/contextlint/releases) 安装 VSIX |

## 相关资源

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## 许可证

[MIT](LICENSE)
