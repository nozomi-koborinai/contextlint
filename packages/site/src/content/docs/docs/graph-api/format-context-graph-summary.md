---
title: formatContextGraphSummary
description: Format a human-readable summary of the graph.
---

## Overview

Takes a `ContextGraph` and returns a multi-line string that highlights the entry points (nodes that no one references) and the most heavily referenced top nodes.

## Why it exists

When inspecting the graph as a whole, raw node and edge data is hard to read. `formatContextGraphSummary` condenses the graph into a format that shows **where the entry points are and which files attract the most references** at a glance.

The summary returned by the MCP `context-graph` tool is the unmodified output of this function.

## Signature

```typescript
function formatContextGraphSummary(graph: ContextGraph): string;
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |

## Return value

Returns a `string` containing the following newline-separated sections.

- Line 1 — Summary of node and edge counts.
- `Entry points (no incoming refs)` — List of files with in-degree 0.
- `Most connected (by incoming refs)` — Top 5 files by in-degree.

## Example

```typescript
import { buildContextGraph, formatContextGraphSummary, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

console.log(formatContextGraphSummary(graph));
```

Sample output:

```text
Document Graph: 12 files, 27 edges

Entry points (no incoming refs):
  - docs/index.md
  - docs/getting-started.md

Most connected (by incoming refs):
  - docs/glossary.md (8 in, 0 out)
  - docs/architecture.md (5 in, 3 out)
  - docs/api.md (3 in, 4 out)
```

## Related functions

- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`classifyImpact`](/docs/graph-api/classify-impact/) — Classify the impact set of a specific file in detail
- [`getComponents`](/docs/graph-api/get-components/) — Inspect the structure cluster by cluster
