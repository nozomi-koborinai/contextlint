---
title: getContextSlice
description: Extract the minimal set of documents relevant to a query.
---

## Overview

Takes a file path or an ID as a query and extracts the minimal set of documents related to it via BFS. The walk follows outgoing edges (the documents a given file references) and expands up to the configured depth limit.

## Why it exists

When an AI agent or a human is working on a specific topic, you often want to hand them only the **relevant documents** rather than the whole repository. `getContextSlice` carves out a neighborhood around the query, keeping the context window and reader's cognitive load small.

The query is interpreted in two ways:

- If the query matches a file path in the graph, that file is used as the starting point for the outgoing-edge walk.
- Otherwise, every document is scanned for the query as a table cell value, and every matching file is used as a starting point.

## Signature

```typescript
function getContextSlice(
  graph: ContextGraph,
  documents: Map<string, ParsedDocument>,
  query: string,
  maxDepth?: number,
): string[];
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `graph` | `ContextGraph` | ✓ | The graph built by `buildContextGraph`. |
| `documents` | `Map<string, ParsedDocument>` | ✓ | The same document Map used to build the graph. Required for scanning tables when the query is an ID. |
| `query` | `string` | ✓ | A file path or ID string. |
| `maxDepth` | `number` | — | Maximum BFS depth. Defaults to `2`. |

## Return value

Returns `string[]`. The array contains the starting file or files plus every file reachable within `maxDepth` steps, sorted alphabetically. If no file matches the query, an empty array is returned.

## Example

```typescript
import { buildContextGraph, getContextSlice, loadDocuments } from "@contextlint/core";

const documents = loadDocuments(["docs/**/*.md"]);
const graph = buildContextGraph(documents);

// Slice by file path
const slice = getContextSlice(graph, documents, "docs/specs/auth.md");
console.log(slice);

// Slice by ID (searches table cells)
const reqSlice = getContextSlice(graph, documents, "REQ-AUTH-01", 3);
console.log(reqSlice);
```

## Related functions

- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build the input graph
- [`getImpactSet`](/docs/graph-api/get-impact-set/) — Walk the opposite direction (files that reference a given file)
- [`getComponents`](/docs/graph-api/get-components/) — Get clusters at the connected-component level
