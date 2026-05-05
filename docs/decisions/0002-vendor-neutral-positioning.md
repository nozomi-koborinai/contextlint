# 0002: Vendor-neutral positioning (LSP / MCP as technical detail)

**Status**: Accepted

## Context

contextlint integrates with editors (via LSP) and AI agents (via MCP). The natural temptation is to lead public messaging with the protocol names ("we ship an LSP server!", "we have an MCP server!"). But:

- Most users don't know what "MCP" or "LSP" mean. They know the *tools they use* — VS Code, Cursor, Neovim, Claude Code, Cline, Windsurf.
- The MCP-server-as-headline phase has commoditized — "we built an MCP server" no longer drives engagement (per ecosystem read in 2026-05).
- Protocol-name-as-headline assumes background knowledge the broader audience doesn't have.

## Decision

In all public-facing materials (LP, README, blog posts, social), lead with **concrete tool names**. Demote LSP / MCP to "How it works" / Integrations / FAQ sections.

Example pattern, used in the LP's 3-Layer feedback section:

```text
While AI writes → AI agent integration
                  Claude Code · Cursor Agent · Cline · Windsurf
```

Not:

```text
MCP integration
```

## Consequences

- **+** Readers who know the tools (most readers) immediately recognize what contextlint plugs into.
- **+** Readers who don't care about protocols still understand the value.
- **+** Future-proof: if a successor protocol to MCP emerges, surface the tools, not the protocol.
- **−** Loses appeal to MCP-protocol enthusiasts who scan for protocol mentions. They find it in the README / docs anyway, so the loss is small.

## Related

- `decisions/0003-agentskills-io-distribution.md` — same vendor-neutral logic applied to skill distribution.
