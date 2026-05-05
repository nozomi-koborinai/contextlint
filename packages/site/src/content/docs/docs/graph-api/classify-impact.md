---
title: classifyImpact
description: Classify impact as direct vs transitive.
---

## Overview

Returns the files affected by changing the given file, classified into **direct references** (one hop) and **transitive references** (two or more hops). Direct references also carry a reference count.

## Why it exists

[`getImpactSet`](/docs/graph-api/get-impact-set/) returns a flat list, so it cannot distinguish "files you must review directly" from "files worth a sanity check". `classifyImpact` separates impact into two tiers and attaches the closest direct file (`via`) on each transitive entry, which makes review prioritization and path visualization easier.

The MCP `impact-analysis` tool formats the output of this function directly.

## Signature

```typescript
function classifyImpact(
  graph: ContextGraph,
  filePath: string,
): {
  directlyAffected: { file: string; references: number }[];
  transitivelyAffected: { file: string; via: string }[];
};
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |
| `filePath` | `string` | ✓ | The path of the file whose impact you want to classify. |

## Return value

Returns an object.

- `directlyAffected` — Files that reference `filePath` directly. `references` is the reference count within the same source (the total number of times that file links to `filePath`). Sorted by file path.
- `transitivelyAffected` — Files reached indirectly rather than directly. `via` is the closest "directly affected file" on the path. Sorted by file path.

## Example

```typescript
import { buildContextGraph, classifyImpact, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const impact = classifyImpact(graph, "docs/architecture.md");

console.log(`Direct impact: ${impact.directlyAffected.length}`);
for (const item of impact.directlyAffected) {
  console.log(`  - ${item.file} (${item.references} refs)`);
}

console.log(`Transitive impact: ${impact.transitivelyAffected.length}`);
for (const item of impact.transitivelyAffected) {
  console.log(`  - ${item.file} (via: ${item.via})`);
}
```

## Related functions

- [`getImpactSet`](/docs/graph-api/get-impact-set/) — The unclassified flat-list version
- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`formatContextGraphSummary`](/docs/graph-api/format-context-graph-summary/) — Summary of the graph as a whole
