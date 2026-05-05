---
title: Graph API
description: APIs for working with the document dependency graph programmatically.
---

`@contextlint/core` exposes a set of functions that build a dependency graph from parsed documents and let you query impact sets, related documents, dependency order, and more. The Graph API is the **programmatic interface** for calling these functions directly.

Use it when you want to work with relationships between documents from scripts or tooling rather than using contextlint as a linter. The MCP `context-graph` / `context-slice` / `impact-analysis` tools call this API internally as well (see [AI Agents](/docs/integrations/ai-agents/)).

For the design philosophy and the reasoning behind why the Context Graph exists, see [Context Graph](/docs/concepts/context-graph/). This category focuses on **how to use the API**.

## What this category covers

- [`buildContextGraph`](/docs/graph-api/build-context-graph/) — Build a dependency graph from parsed documents
- [`getImpactSet`](/docs/graph-api/get-impact-set/) — Get the list of files affected by changing a given file
- [`getContextSlice`](/docs/graph-api/get-context-slice/) — Extract the minimal set of documents relevant to a query
- [`topologicalSort`](/docs/graph-api/topological-sort/) — Order files by dependency
- [`getComponents`](/docs/graph-api/get-components/) — Get connected components (clusters of documents)
- [`classifyImpact`](/docs/graph-api/classify-impact/) — Classify impact as direct vs transitive
- [`formatContextGraphSummary`](/docs/graph-api/format-context-graph-summary/) — Format a human-readable summary of the graph
