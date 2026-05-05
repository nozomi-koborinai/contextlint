---
title: getComponents
description: Get connected components (clusters of documents).
---

## Overview

Treats the graph as undirected and extracts its connected components. BFS groups nodes that are reachable from one another, returning "clusters" of documents.

## Why it exists

Even in a large repository, documents often split into several independent clusters in practice. `getComponents` lets you see which document groups form a coherent context together and whether any isolated clusters exist.

It is also useful for finding orphan documents — components of size 1, where no document references them and they reference nothing (the [GRP-003](/docs/rules/grp-003/) rule detects this automatically).

## Signature

```typescript
function getComponents(graph: ContextGraph): string[][];
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |

## Return value

Returns `string[][]`. Each component is an array of file paths sorted alphabetically. The components themselves are also sorted deterministically by their first file path.

## Example

```typescript
import { buildContextGraph, getComponents, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const components = getComponents(graph);

console.log(`Detected ${components.length} clusters`);

for (const [index, component] of components.entries()) {
  console.log(`\nCluster ${index + 1}: ${component.length} files`);
  for (const file of component) {
    console.log(`  - ${file}`);
  }
}

// Extract orphan documents
const orphans = components.filter((c) => c.length === 1).flat();
console.log(`Orphan documents: ${orphans.length}`);
```

## Related functions

- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`topologicalSort`](/docs/graph-api/topological-sort/) — The directed counterpart that orders by dependency
- [`getContextSlice`](/docs/graph-api/get-context-slice/) — Get related documents starting from a query
