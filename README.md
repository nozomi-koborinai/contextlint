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

🌐 [日本語](README.ja.md) | [中文](README.zh.md) | [한국어](README.ko.md)

A rule-based linter for structured Markdown documents.
Catch broken references, duplicate IDs, missing sections, and
structural issues — deterministically, in seconds, CI-friendly.

> 📚 Full reference and guides: **<https://contextlint.dev>**

## Why contextlint?

In AI-driven workflows like SDD (Spec Driven Development), Markdown documents
form a dependency graph: requirements reference IDs, design docs link back to
specs, ADRs cross-reference each other. When that graph silently breaks — a
deleted requirement, a mistyped ID, a missing section — the consequence shows
up only at read time.

contextlint provides **deterministic, static validation** for structured
Markdown. No AI, no cost, CI-friendly.

> contextlint focuses on **content semantics and cross-file integrity**. For
> Markdown syntax, formatting, and style, use
> [markdownlint](https://github.com/DavidAnson/markdownlint) alongside
> contextlint — they complement each other well.

## Quick Start

**AI-assisted (recommended)** — for Claude Code, Cursor, Codex, Gemini CLI,
GitHub Copilot, and any [Agent Skills](https://agentskills.io)-compatible
client. Requires GitHub CLI **v2.90+**:

```sh
gh skill install nozomi-koborinai/contextlint contextlint-init
```

Then ask your agent to "set up contextlint". The skill detects your repo
layout, infers rules, installs the CLI, and writes `contextlint.config.json`
for you.

**Manual setup**:

```bash
npm install -D @contextlint/cli
npx contextlint init
npx contextlint
```

Sample output:

```text
docs/requirements.md
  line 3   warning  Empty cell in column "Status"  TBL-002

docs/design.md
  line 12  error    Link target "./api.md" does not exist  REF-001

1 error, 1 warning in 2 files
```

## Rules

contextlint ships **21 rules** across 7 categories:

| Prefix | Category | What it validates | Count |
| --- | --- | --- | --- |
| TBL | Table | Required columns, empty cells, allowed values, patterns, cross-column constraints, cross-file ID uniqueness | 6 |
| SEC | Section | Existence and order of section headings | 2 |
| STR | Structure | Project-level file existence | 1 |
| REF | Reference | Links, anchors, cross-file ID references, stability consistency, zone dependencies, image references | 6 |
| CHK | Checklist | Checklist completion status | 1 |
| CTX | Context | Placeholder detection, term consistency | 2 |
| GRP | Graph | Traceability chains, circular references, orphan documents | 3 |

See [Rules](https://contextlint.dev/docs/rules/) for the full per-rule reference.

## Learn more

For commands beyond `lint` (`init`, `impact`, `slice`, `graph`, `compile`,
`--watch`), run `npx contextlint --help` or browse the docs:

| Topic | Link |
| --- | --- |
| Get Started | <https://contextlint.dev/docs/get-started/> |
| Configuration reference | <https://contextlint.dev/docs/configuration/> |
| Rule reference (all 21) | <https://contextlint.dev/docs/rules/> |
| CLI commands and flags | <https://contextlint.dev/docs/integrations/cli/> |
| Editor integration (LSP) | <https://contextlint.dev/docs/integrations/editors/> |
| AI agents (MCP, Agent Skills) | <https://contextlint.dev/docs/integrations/ai-agents/> |
| CI/CD integration | <https://contextlint.dev/docs/integrations/ci-cd/> |
| Recipes (ADR / SDD / monorepo) | <https://contextlint.dev/docs/recipes/> |
| Programmatic Graph API | <https://contextlint.dev/docs/graph-api/> |

## Packages

| Package | Description |
| --- | --- |
| `@contextlint/core` | Rule engine and Markdown parser |
| `@contextlint/cli` | CLI entry point (`contextlint` command) |
| `@contextlint/mcp-server` | MCP server for AI tool integration |
| `@contextlint/lsp-server` | Language Server Protocol implementation |
| `contextlint-vscode` | VS Code / Cursor extension — install the VSIX from [GitHub Releases](https://github.com/nozomi-koborinai/contextlint/releases) until Marketplace publishing lands |

## Resources

- [Introducing contextlint — A Linter for Markdown Document Integrity](https://koborin.ai/tech/contextlint-introduction/)

## License

[MIT](LICENSE)
