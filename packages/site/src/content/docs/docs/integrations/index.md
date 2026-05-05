---
title: Integrations
description: How to plug contextlint into your editor, AI tooling, and CI.
---

contextlint is more than a standalone CLI — it plugs into three layers of your development flow (while you write, through AI, and before merging). This category covers the setup and behavior of each integration target.

## Integration layers

| Layer | Target | Feedback timing |
| --- | --- | --- |
| While editing | Editors (LSP) | On save / on type, instantly |
| Through AI | AI tools (MCP / Skills) | When AI manipulates documents |
| At runtime | CLI | Manual runs / watch mode |
| Before merging | CI/CD | On PR / push |

Each one runs independently, so you can adopt only the pieces you need.

## What's in this category

- [CLI](/docs/integrations/cli/) — the `contextlint` command, subcommands, flags, watch mode, and JSON output
- [Editors (LSP)](/docs/integrations/editors/) — editor integration via the Language Server Protocol
- [AI Agents](/docs/integrations/ai-agents/) — the MCP server and Agent Skills
- [CI/CD](/docs/integrations/ci-cd/) — GitHub Actions and pipeline integration through JSON output
