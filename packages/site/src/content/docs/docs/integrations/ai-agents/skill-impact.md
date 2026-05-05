---
title: contextlint-impact Skill
description: The role and behavior of the Skill that uses the Context Graph to classify direct and transitive impact of file changes or deletions.
---

`contextlint-impact` is the Skill that analyzes **how a file change or deletion ripples through the document graph**. It's invoked automatically when AI receives requests like "what breaks if I change design.md?" or "is it safe to delete FR-101?".

## Why this Skill exists

The more documents a project has, the more a single-file change radiates into unexpected places.

- `grep` finds **direct mentions** but can't capture **transitive reference chains**
- At a 100-file scale, tracing transitive dependencies in your head stops being practical
- Bulk AI edits, applied without awareness of impact, scatter broken references across the doc graph

contextlint embeds the Context Graph engine in `@contextlint/core`. `contextlint-impact` translates that engine into the simple question: "what breaks if I touch this file?"

## Trigger conditions

The Skill triggers on requests like the following. You don't need to mention it by name.

- "What breaks if I change design.md?" / "Is it safe to delete FR-101?"
- "I want to know the dependencies" / "What references this doc?"
- "I want to refactor — what's the blast radius?"

It also triggers from requests where "contextlint" isn't mentioned but the context is around impact, dependencies, or deletion safety.

## Behavior

### 1. Verify setup

Confirms that `contextlint.config.json` exists and that the cross-file rules (REF-001 / GRP-002) are enabled. Without these, the graph collapses into "a flat list of nodes" and impact analysis stops being meaningful.

If not set up, the Skill points you to the [contextlint-init Skill](/docs/integrations/ai-agents/skill-init/).

### 2. Identify the target

The user request may include a file path, or an ID (`FR-101`, etc.).

| User input | Target |
| --- | --- |
| `design.md` | The file `design.md` |
| `delete FR-101...` | ID `FR-101` → resolved to its defining file before analysis |
| "I want to refactor the auth part of the API" | Ambiguous → ask the user "which file?" |

For ID input, the Skill first runs something like `grep -rn 'FR-101' . --include='*.md'` to find the defining file, then runs impact analysis from there.

### 3. Run impact analysis

```sh
npx contextlint impact <target-file> --format json
```

JSON output lets the Skill process the result structurally. In environments where MCP is available, the Skill calls the `impact-analysis` tool directly and skips the JSON parse.

### 4. Interpret the output

The JSON contains:

- **direct** — files that reference the target directly
- **transitive** — files reachable indirectly (chains of references)
- **lint violations** within the impact set — motivation for running `contextlint-fix` after the edit

If the output is empty, the target may be an **orphan** in the doc graph. The Skill notes that "this file is isolated in the graph, but that doesn't guarantee it isn't referenced from code, build configs, or the README."

### 5. Present a structured summary

Instead of a flat file list, the Skill splits the output into direct / transitive / notes.

```
Impact analysis for `design.md`:

DIRECT (5 files reference this directly):
  - requirements.md
  - overview.md
  - api/auth.md
  - api/users.md
  - testing.md

TRANSITIVE (12 more files affected indirectly):
  - architecture.md (via overview.md)
  - migrations/2026-01.md (via api/users.md)
  - ...

HIGHLIGHTS:
  - api/auth.md is a hub referenced from 8 files → high ripple risk
  - 3 lint violations detected within the impact set (running contextlint-fix after the edit is recommended)

RECOMMENDATIONS:
  - Update direct first, then check whether transitive references still hold
  - The cascade is large — consider splitting the change across multiple PRs
```

A flat list makes it hard to see "where to start", so the Skill returns prioritized recommendations like "update direct first" alongside the data.

### 6. Observation-driven extras

| Observation | Recommendation |
| --- | --- |
| More than 10 transitive files | Split the PR into reviewable chunks |
| Target is a hub (highly referenced) | Suggest a backwards-compatible change (deprecate-then-remove) |
| Target is an orphan | Verify references from code, build configs, and the README before deleting |
| Lint violations in the impact set | Run `contextlint-fix` after the edit |
| Circular reference detected | Suggest enabling `grp002` and resolving the cycle first |

## Edge cases

- **No `contextlint.config.json`** — points you to `contextlint-init` and skips the impact run.
- **REF-001 / GRP-002 disabled** — warns and proposes enabling them, since the graph is nearly empty otherwise.
- **Target file doesn't exist** — asks whether it's a typo or already deleted.
- **Target is part of a cycle** — explains that transitive results are misleading until the cycle is resolved.
- **Impact set larger than 100** — switches from a flat list to a per-cluster tree view. Also suggests `contextlint slice` to scope down further.
- **MCP server available** — prefers the `impact-analysis` tool to skip the JSON parse.

## Related

- Violations within the impact set can be fixed with the [contextlint-fix Skill](/docs/integrations/ai-agents/skill-fix/).
- For the concept and mechanics of the Context Graph, see [Concepts → Context Graph](/docs/concepts/context-graph/).
- To call the same functionality programmatically, use the Context Graph API in `@contextlint/core` (`buildContextGraph`, `classifyImpact`, etc.) directly.
