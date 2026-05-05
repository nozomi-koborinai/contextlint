---
title: getImpactSet
description: Get the list of files affected by changing a given file.
---

## Overview

Returns the files that reference a given file, covering both direct and transitive references. Internally it walks the graph's reverse edges with BFS, and the target file itself is excluded from the result.

## Why it exists

Before changing or deleting a document, you often want to know which other documents will be affected. `getImpactSet` answers "if I change this file, which places do I need to review?" with a flat list.

If you need to distinguish direct from transitive references, use [`classifyImpact`](/docs/graph-api/classify-impact/) instead.

## Signature

```typescript
function getImpactSet(
  graph: ContextGraph,
  filePath: string,
): string[];
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |
| `filePath` | `string` | ✓ | The path of the file whose impact set you want to compute. It must match a key in `graph.nodes`. |

## Return value

Returns `string[]`. The array contains every file path that references `filePath` directly or transitively, sorted alphabetically. `filePath` itself is not included. If the file does not appear in the graph or is not referenced by anyone, an empty array is returned.

## Example

```typescript
import { buildContextGraph, getImpactSet, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const affected = getImpactSet(graph, "docs/architecture.md");

if (affected.length === 0) {
  console.log("No files are affected");
} else {
  console.log(`${affected.length} files are affected:`);
  for (const file of affected) {
    console.log(`  - ${file}`);
  }
}
```

## Related functions

- [`classifyImpact`](/docs/graph-api/classify-impact/) — Same query, but classifies results as direct vs transitive
- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`getContextSlice`](/docs/graph-api/get-context-slice/) — Walk the opposite direction (files referenced *by* a given file)
