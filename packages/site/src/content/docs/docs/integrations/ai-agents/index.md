---
title: AI Agents
description: Two integration paths (MCP / Skills) for calling contextlint from AI agents.
---

contextlint offers two integration paths for use from AI agents. From hosts like Claude Code, Cursor Agent, Cline, Codex, Gemini CLI, and GitHub Copilot, you can fold document-integrity checks into your conversation.

## Two integration paths

| Path | Protocol | Main hosts | Distribution |
| --- | --- | --- | --- |
| **MCP server** | Model Context Protocol | Claude Desktop / Cursor / Cline / Codex, etc. | `@contextlint/mcp-server` package |
| **Agent Skills** | [agentskills.io](https://agentskills.io) spec | Claude Code / Cursor Agent / Codex / Gemini CLI / GitHub Copilot, etc. | `gh skill install` from a GitHub repo |

The two don't compete — pick whichever suits the goal. MCP is a protocol for **AI to call contextlint's features directly**, while Skills are **workflows that tell AI what you want done in natural language**.

## Which to choose

- **"I want AI to run lint" / "I want AI to read the document graph"** → [MCP server](/docs/integrations/ai-agents/mcp-server/)
- **"I want AI to set up contextlint" / "I want AI to fix violations" / "I want AI to analyze impact"** → [Skills](/docs/integrations/ai-agents/skills/)

If your host supports both (Claude Code, etc.), you can use them together. A Skill may call MCP tools internally as well.

## What's in this section

- [MCP server](/docs/integrations/ai-agents/mcp-server/) — `@contextlint/mcp-server` setup and the five tools it exposes
- [Agent Skills](/docs/integrations/ai-agents/skills/) — using `gh skill install` and the list of supported hosts
- [contextlint-init Skill](/docs/integrations/ai-agents/skill-init/) — let AI set up contextlint in a repository
- [contextlint-fix Skill](/docs/integrations/ai-agents/skill-fix/) — let AI fix detected violations
- [contextlint-impact Skill](/docs/integrations/ai-agents/skill-impact/) — let AI analyze the impact of a file change

## Related

- For the shortest path to setup, see [Quick Start — AI integration](/docs/get-started/quick-start-ai/). This section covers the **detailed specs and use cases** for each Skill / tool.
