---
title: Context Graph
description: Why a document dependency graph sits at the foundation, and the conceptual model behind it.
---

Rather than validating each file in isolation, contextlint **treats the entire project's documentation as a single dependency graph**. This is the Context Graph. This page explains why a graph was chosen as the foundation and which concepts the graph captures.

The concrete API surface (`buildContextGraph`, `getImpactSet`, and so on) is covered in the [Graph API](/docs/graph-api/) category. Concepts focuses on the **conceptual model**.

## Why a graph is needed

Documents are not a loose collection of independent files. They form a **network of references that point at one another**.

- A requirement ID is referenced from another file
- A spec file links out to other files
- The stability of a status propagates downstream through dependencies
- A section is referenced via an anchor from another file

File-by-file linting cannot validate **integrity that crosses files**. Problems like the following can only be detected once a graph is built.

| Problem | Why a graph is needed |
|---------|----------------------|
| A requirement ID is renamed, but referencing files still hold the old ID | Both the definition side and the reference side must be inspected **at the same time** |
| The chain `requirements.md` → `design.md` → `test.md` is broken | Reference relationships must be **traced** across multiple files |
| Circular dependency `A.md` → `B.md` → `C.md` → `A.md` | The whole graph must be examined to detect a **cycle** |
| Orphan documents that no one references | The **incoming-reference status** of every file must be aggregated |

contextlint can address these because it builds an internal **directed graph** with files as nodes and references as edges.

## What the Context Graph models

The Context Graph is a data structure that models document dependencies inside a project as a directed graph.

| Element | What it represents |
|---------|--------------------|
| **Node (vertex)** | A single Markdown file |
| **Edge** | A reference from one file to another (link, ID reference, anchor, image) |
| **Direction** | "Referencing side" → "referenced side" |

This model lets contextlint answer questions such as:

- When this file changes, which files are affected?
- What is the minimal set of documents related to this file?
- Is there a circular dependency between any documents?
- Are there orphan documents that nothing references?
- Is the traceability chain requirements → spec → design → tests unbroken?

## Direct vs transitive impact

By following dependencies, the Context Graph classifies the blast radius of a change as **direct** or **transitive**.

```
requirements.md
    ↓ referenced by
spec.md (direct impact)
    ↓ referenced by
test-plan.md (transitive impact)
```

When `requirements.md` changes, `spec.md` is impacted directly, while `test-plan.md` is impacted **transitively** through `spec.md`. grep alone cannot trace transitive impact. Building the Context Graph makes it possible to recursively understand **how far a change propagates**.

This information serves as input when deciding "which files should be reviewed together" during a refactor or requirement change.

## Why the graph is a foundation

The Context Graph is not just an internal data structure for one or two rules (such as GRP-001 / GRP-002 / GRP-003). It backs **multiple features across contextlint as a whole**.

| Feature | How it uses the graph |
|---------|----------------------|
| Cross-file reference rules (REF-\*) | Follow edges between files to verify the reference target exists |
| ID traceability (REF-002, GRP-001) | Map definitions and references onto nodes for tracking |
| Circular reference detection (GRP-002) | Detect cycles in the graph |
| Orphan document detection (GRP-003) | Detect nodes with in-degree 0 |
| Impact analysis (`contextlint impact`) | Enumerate nodes reachable from a given node |
| Context slicing (`contextlint slice`) | Extract the minimal subgraph relevant to a query |
| Context Compiler (`contextlint compile`) | Classify document roles (entry / hub / leaf / bridge / isolated) from the graph |

These are distinct features, but **sharing the same graph representation** keeps their outputs consistent. If one rule decides "this file depends on A," impact analysis reflects the same dependency.

## Determinism

Building the Context Graph is **deterministic**. The same set of documents always produces the same graph.

- Does not use an LLM
- Does not look at file mtime or git timestamps
- Takes only file content as input

This property gives stable results in CI and lets the editor, AI host, and CI three-layer feedback share the same graph (see [Three-layer feedback design](/docs/concepts/three-layer-feedback/) for details).

## Next steps

- [Graph API](/docs/graph-api/) — the programmatic API for working with the Context Graph
- [Rules](/docs/rules/) — rules built on the Context Graph (REF-\*, GRP-\*, TBL-006)
