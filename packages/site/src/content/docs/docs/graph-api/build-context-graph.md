---
title: buildContextGraph
description: Build a dependency graph from parsed documents.
---

## Overview

Builds a graph that represents the dependency relationships between documents from a Map of parsed documents. Each document's relative links and image references are collected as edges, and each node is annotated with its in-degree and out-degree.

## Why it exists

All other Graph API functions (`getImpactSet`, `topologicalSort`, `classifyImpact`, and so on) take the `ContextGraph` returned by this function as input. It is the entry point for any graph operation.

Edges are resolved from the source file's relative links, and are added only when the resolved target exists in the `documents` Map. Anchor fragments (`#section`) are stripped, and self-references are ignored. The output is deterministic — both nodes and edges are sorted by file path.

## Signature

```typescript
function buildContextGraph(
  documents: Map<string, ParsedDocument>,
): ContextGraph;
```

The related types are:

```typescript
interface GraphNode {
  filePath: string;
  inDegree: number;
  outDegree: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "link" | "image";
  line: number;
}

interface ContextGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `documents` | `Map<string, ParsedDocument>` | ✓ | A Map keyed by file path with `parseDocument` results as values. Keys may be relative or absolute, but relative paths are recommended for parity with `lintFiles`. |

## Return value

Returns a `ContextGraph`.

- `nodes` — Each file path together with its in-degree and out-degree. Sorted by file path.
- `edges` — Directed edges from `source` to `target`. `type` indicates whether the edge is a link or an image reference. Sorted by source, target, and line number.

## Example

```typescript
import { loadDocuments } from "@contextlint/core";
import { buildContextGraph } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(`${graph.nodes.length} files, ${graph.edges.length} edges`);

for (const edge of graph.edges) {
  console.log(`${edge.source} → ${edge.target} (${edge.type}, line ${edge.line})`);
}
```

## Related functions

- [`getImpactSet`](/docs/graph-api/get-impact-set/) — Get the impact set using the graph
- [`topologicalSort`](/docs/graph-api/topological-sort/) — Order the graph by dependency
- [`formatContextGraphSummary`](/docs/graph-api/format-context-graph-summary/) — Format a summary of the graph
