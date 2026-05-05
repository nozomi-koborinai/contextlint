# @contextlint/core

Rule engine, Markdown parser, and Context Graph API for [contextlint](https://contextlint.dev) — a semantic linter for structured Markdown documents.

## Installation

```bash
npm install @contextlint/core
```

> Most users should install [`@contextlint/cli`](https://www.npmjs.com/package/@contextlint/cli) instead. This package is for programmatic / library usage.

## Lint usage

```typescript
import { parseDocument, runRules, tbl001 } from "@contextlint/core";

const doc = parseDocument(
  "| ID | Status |\n|----|--------|\n| 1  | Done   |",
);
const rule = tbl001({
  requiredColumns: ["ID", "Status", "Description"],
});
const messages = runRules([rule], doc, "example.md");
// [{ ruleId: "TBL-001", severity: "error",
//    message: "Missing required column ...", line: 1 }]
```

## Context Graph API

Build a dependency graph from parsed documents and analyze cross-doc impact, slice the relevant context for a query, classify impact direct vs transitive, and more.

```typescript
import {
  parseDocument,
  buildContextGraph,
  getImpactSet,
} from "@contextlint/core";
import { readFileSync } from "node:fs";

const documents = new Map();
documents.set("docs/requirements.md", parseDocument(readFileSync("docs/requirements.md", "utf-8")));
documents.set("docs/design.md", parseDocument(readFileSync("docs/design.md", "utf-8")));

const graph = buildContextGraph(documents);
const impacted = getImpactSet(graph, "docs/requirements.md");
// Set of files affected by changing requirements.md
```

| Function | Purpose |
| --- | --- |
| `buildContextGraph(documents)` | Build a dependency graph from parsed documents |
| `getImpactSet(graph, filePath)` | All files affected by changing the given file |
| `getContextSlice(graph, documents, query, maxDepth?)` | Minimal relevant file set for a query (file path or ID) |
| `topologicalSort(graph)` | Topological order of the document graph |
| `getComponents(graph)` | Connected components (clusters of related files) |
| `classifyImpact(graph, filePath)` | Direct vs transitive impact classification |
| `formatContextGraphSummary(graph)` | Human-readable summary of the graph |

## Compile

`compileContext` synthesizes documents + config into a single `SKILL.md` for downstream AI agents:

```typescript
import { compileContext } from "@contextlint/core";

const skillMd = await compileContext(["docs/**/*.md"], config, process.cwd());
```

See the [main repository](https://github.com/nozomi-koborinai/contextlint) for the full rule reference.

## See also

- Project: <https://contextlint.dev>
- CLI: `@contextlint/cli`

## License

[MIT](https://github.com/nozomi-koborinai/contextlint/blob/main/LICENSE)
