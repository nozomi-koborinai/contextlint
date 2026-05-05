---
title: Agent Skills
description: The Skills contextlint provides to agentskills.io-compatible hosts and how to install them with gh skill install.
---

contextlint publishes three Skills following the [agentskills.io](https://agentskills.io) spec. A Skill is a unit that tells AI what you want done; internally it captures a workflow combining command execution, file traversal, and reasoning. Once invoked from an AI host, the Skill produces the expected outcome without you walking the AI through each step.

## Available Skills

| Skill | Purpose | Details |
| --- | --- | --- |
| `contextlint-init` | Initial setup for a repository — scans the doc layout, infers rules, and installs the CLI | [contextlint-init](/docs/integrations/ai-agents/skill-init/) |
| `contextlint-fix` | Resolves detected violations through a mix of mechanical fixes and human confirmation | [contextlint-fix](/docs/integrations/ai-agents/skill-fix/) |
| `contextlint-impact` | Analyzes the impact of a file change using the Context Graph | [contextlint-impact](/docs/integrations/ai-agents/skill-impact/) |

## Installation

Requires GitHub CLI v2.90 or newer. If you don't have it yet, see the [GitHub CLI website](https://cli.github.com/).

```bash
gh skill install nozomi-koborinai/contextlint contextlint-init
gh skill install nozomi-koborinai/contextlint contextlint-fix
gh skill install nozomi-koborinai/contextlint contextlint-impact
```

`contextlint-init` alone is enough to start. After `init` finishes the repository setup, add `fix` or `impact` as needed.

## Syntax

```
gh skill install OWNER/REPO SKILL
gh skill install OWNER/REPO SKILL@VERSION
gh skill install OWNER/REPO SKILL --agent claude-code --scope user
```

| Option | Description |
| --- | --- |
| `OWNER/REPO` | The GitHub repository where the Skill is published |
| `SKILL` | The `<name>` part of `skills/<name>/SKILL.md` in the repo |
| `@VERSION` | Version tag (optional) |
| `--agent` | Target host (`claude-code` etc., varies by host) |
| `--scope` | `user` (user-wide) or `repo` (repo-only) |

`gh skill update`, `gh skill search`, and `gh skill publish` are also available.

## Supported hosts

Any host that follows the agentskills.io spec runs the same Skills.

- Claude Code
- Cursor Agent
- Cline
- Codex
- Gemini CLI
- GitHub Copilot
- Other hosts compatible with the [agentskills.io](https://agentskills.io) spec

For per-host registration steps and supported versions, refer to agentskills.io and the host's own documentation.

## How to invoke a Skill

After installation, just tell your AI host what you want done — the Skill is invoked automatically. You don't need to mention the Skill name.

For example, any of the following requests will trigger `contextlint-init`:

> Set up contextlint
>
> I want to add a Markdown linter
>
> Add document integrity checking

`contextlint-fix` is triggered by requests like "fix lint", "fix the broken links", or "contextlint is showing errors", and `contextlint-impact` by requests like "what breaks if I change design.md?" or "is it safe to delete this doc?". See each Skill's own page for the detailed trigger conditions and behavior.

## Differences from the MCP server

| Aspect | Skills | [MCP server](/docs/integrations/ai-agents/mcp-server/) |
| --- | --- | --- |
| Abstraction | High (workflow level) | Low (tool level) |
| How AI is told | Natural-language request | Tool call |
| Distribution | `skills/<name>/SKILL.md` in a GitHub repo | npm package |
| Project-specific config | Not required (the Skill infers it) | `contextlint.config.json` is required |

You can use them together. The `contextlint-fix` Skill, for example, prefers the MCP `lint` tool when available — Skills and MCP complement each other.

## Why we recommend going through Skills

contextlint has 21 rules across seven categories. Reading all of them by hand to pick the right configuration is heavy lifting, so the `contextlint-init` Skill **inspects the repository and proposes a configuration** instead. You only need to confirm at the end, which dramatically reduces the effort needed for the initial setup.
