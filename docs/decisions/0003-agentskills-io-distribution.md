# 0003: Adopt agentskills.io for skill distribution

**Status**: Accepted

## Context

Agent Skills can be distributed several ways:

- **Claude Code-specific plugin marketplace** (`.claude-plugin/marketplace.json`). Works with Claude Code, but not with Cursor, Codex, Gemini CLI, or any of the 35+ other agentskills.io-compatible clients.
- **Personal marketplace** under the maintainer's blog / repo. Couples the skill's lifecycle to a personal repo and signals "personal hobby project".
- **agentskills.io standard**. Vendor-neutral open standard originally from Anthropic, adopted by Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, OpenCode, OpenHands, and dozens of others. Distribution via `gh skill install <owner>/<repo> <skill>` (GitHub CLI subcommand v2.90+).

## Decision

Ship Agent Skills under `skills/<skill-name>/SKILL.md` in the contextlint repo, following the agentskills.io specification.

- The contextlint repo itself is the distribution channel. No separate marketplace repo.
- Users install with `gh skill install nozomi-koborinai/contextlint <skill> [--pin vX.Y.Z]`.
- Skills coordinate releases with the npm packages: a single `vX.Y.Z` git tag drives both.
- Avoid Claude-Code-specific syntax inside SKILL.md (e.g., the `` !`command` `` dynamic context injection) so skills stay portable across all agentskills.io clients.

## Consequences

- **+** Skills work in 35+ AI agent clients out of the box.
- **+** Discoverable via `gh skill search` (GitHub Code Search backend).
- **+** Same release cadence as the core packages — no separate skill-only releases to manage.
- **−** Lose Claude-Code-specific niceties (dynamic context injection, namespacing tricks). Mitigated by writing instructions for the AI to execute via Bash, which works everywhere.
- **−** No central skill registry — discovery relies on GitHub search and external mentions (LP, README, blog).

## Related

- `decisions/0002-vendor-neutral-positioning.md` — same vendor-neutral principle, applied to messaging rather than distribution.
