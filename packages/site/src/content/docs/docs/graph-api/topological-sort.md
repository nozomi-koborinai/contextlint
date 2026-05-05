---
title: topologicalSort
description: Order documents by dependency.
---

## Overview

Performs a topological sort of the document graph using Kahn's algorithm. Files with no dependencies (in-degree 0) come first, and files that are referenced come later.

## Why it exists

Use this whenever the order in which documents are processed should follow their dependency relationships. Examples include reading glossary → spec → ADR in order, deciding build order, or laying out a migration guide upstream-first.

If the graph contains cycles, nodes that belong to a cycle are not included in the result. When the returned array is shorter than the total node count, that is a sign of a cycle (use the [GRP-002](/docs/rules/grp-002/) rule to detect cycles).

## Signature

```typescript
function topologicalSort(graph: ContextGraph): string[];
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |

## Return value

Returns `string[]`. The array contains file paths sorted by dependency, with in-degree-0 nodes at the front. Within the same level, ordering is deterministic — alphabetical. Nodes that belong to cycles are omitted.

## Example

```typescript
import { buildContextGraph, topologicalSort, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

const ordered = topologicalSort(graph);

if (ordered.length < graph.nodes.length) {
  const missing = graph.nodes.length - ordered.length;
  console.warn(`${missing} nodes are part of a cycle`);
}

for (const file of ordered) {
  console.log(file);
}
```

## Related functions

- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`getComponents`](/docs/graph-api/get-components/) — Use this when you want to handle each connected component separately
- [`getImpactSet`](/docs/graph-api/get-impact-set/) — Use this when you only need the impact set of a specific file
