import { describe, it, expect } from "bun:test";
import { parseDocument } from "./parser.js";
import type { ParsedDocument } from "./parser.js";
import {
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
  formatContextGraphSummary,
} from "./context-graph.js";
import type { ContextGraph } from "./context-graph.js";

function makeDocs(
  filesMap: Record<string, string>,
): Map<string, ParsedDocument> {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }
  return documents;
}

// ---------------------------------------------------------------------------
// buildContextGraph
// ---------------------------------------------------------------------------
describe("buildContextGraph", () => {
  it("builds correct nodes and edges for linked files", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "[requirements](./requirements.md)",
      "/project/docs/requirements.md": "# Requirements",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);

    const edge = graph.edges[0];
    expect(edge).toBeDefined();
    expect(edge.source).toBe("/project/docs/overview.md");
    expect(edge.target).toBe("/project/docs/requirements.md");
    expect(edge.type).toBe("link");
  });

  it("calculates correct in/out degrees", () => {
    const docs = makeDocs({
      "/project/docs/overview.md":
        "[req](./requirements.md) and [design](./design.md)",
      "/project/docs/requirements.md": "# Requirements",
      "/project/docs/design.md": "[req](./requirements.md)",
    });
    const graph = buildContextGraph(docs);

    const overview = graph.nodes.find(
      (n) => n.filePath === "/project/docs/overview.md",
    );
    const requirements = graph.nodes.find(
      (n) => n.filePath === "/project/docs/requirements.md",
    );
    const design = graph.nodes.find(
      (n) => n.filePath === "/project/docs/design.md",
    );

    expect(overview).toBeDefined();
    expect(overview?.outDegree).toBe(2);
    expect(overview?.inDegree).toBe(0);

    expect(requirements).toBeDefined();
    expect(requirements?.inDegree).toBe(2);
    expect(requirements?.outDegree).toBe(0);

    expect(design).toBeDefined();
    expect(design?.outDegree).toBe(1);
    expect(design?.inDegree).toBe(1);
  });

  it("creates image edges", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "![diagram](./images/arch.png)",
      "/project/docs/images/arch.png": "",
    });
    const graph = buildContextGraph(docs);

    expect(graph.edges).toHaveLength(1);
    const edge = graph.edges[0];
    expect(edge).toBeDefined();
    expect(edge.type).toBe("image");
    expect(edge.target).toBe("/project/docs/images/arch.png");
  });

  it("ignores edges to files not in the document map", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "[missing](./not-here.md)",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it("skips self-references", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "[self](#heading) and [also-self](./overview.md)",
    });
    const graph = buildContextGraph(docs);

    expect(graph.edges).toHaveLength(0);
    const node = graph.nodes[0];
    expect(node).toBeDefined();
    expect(node.outDegree).toBe(0);
    expect(node.inDegree).toBe(0);
  });

  it("returns an empty graph for an empty document map", () => {
    const docs = new Map<string, ParsedDocument>();
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it("strips anchor fragments when resolving links", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "[req](./requirements.md#section-1)",
      "/project/docs/requirements.md": "# Section 1",
    });
    const graph = buildContextGraph(docs);

    expect(graph.edges).toHaveLength(1);
    const edge = graph.edges[0];
    expect(edge).toBeDefined();
    expect(edge.target).toBe("/project/docs/requirements.md");
  });

  it("resolves parent-directory links", () => {
    const docs = makeDocs({
      "/project/docs/zones/auth/spec.md":
        "[board](../bulletin-board/spec.md)",
      "/project/docs/zones/bulletin-board/spec.md": "# Spec",
    });
    const graph = buildContextGraph(docs);

    expect(graph.edges).toHaveLength(1);
    const edge = graph.edges[0];
    expect(edge).toBeDefined();
    expect(edge.source).toBe("/project/docs/zones/auth/spec.md");
    expect(edge.target).toBe("/project/docs/zones/bulletin-board/spec.md");
  });

  it("sorts nodes and edges deterministically", () => {
    const docs = makeDocs({
      "/project/b.md": "[a](./a.md)",
      "/project/a.md": "[b](./b.md)",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes[0]?.filePath).toBe("/project/a.md");
    expect(graph.nodes[1]?.filePath).toBe("/project/b.md");
  });

  // CJK content tests
  it("handles Japanese file names and content", () => {
    const docs = makeDocs({
      "/project/docs/概要.md": "[要件](./要件定義.md)\n\n![図](./設計図.png)",
      "/project/docs/要件定義.md": "# 要件定義\n\n| ID | 説明 |\n|---|---|\n| REQ-01 | 認証機能 |",
      "/project/docs/設計図.png": "",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);

    const linkEdge = graph.edges.find((e) => e.type === "link");
    expect(linkEdge).toBeDefined();
    expect(linkEdge?.target).toBe("/project/docs/要件定義.md");

    const imageEdge = graph.edges.find((e) => e.type === "image");
    expect(imageEdge).toBeDefined();
    expect(imageEdge?.target).toBe("/project/docs/設計図.png");
  });

  it("handles Korean file names and content", () => {
    const docs = makeDocs({
      "/project/docs/개요.md": "[요구사항](./요구사항.md)",
      "/project/docs/요구사항.md": "# 요구사항\n\n| ID | 설명 |\n|---|---|\n| REQ-01 | 인증 기능 |",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]?.target).toBe("/project/docs/요구사항.md");
  });

  it("handles Chinese file names and content", () => {
    const docs = makeDocs({
      "/project/docs/概述.md": "[需求](./需求文档.md)",
      "/project/docs/需求文档.md": "# 需求文档\n\n| ID | 说明 |\n|---|---|\n| REQ-01 | 认证功能 |",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]?.target).toBe("/project/docs/需求文档.md");
  });
});

// ---------------------------------------------------------------------------
// getImpactSet
// ---------------------------------------------------------------------------
describe("getImpactSet", () => {
  it("returns direct dependents", () => {
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "# B",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/b.md");

    expect(impact).toEqual(["/project/a.md"]);
  });

  it("returns transitive dependents", () => {
    // a -> b -> c
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/c.md");

    expect(impact).toEqual(["/project/a.md", "/project/b.md"]);
  });

  it("returns empty array when nothing depends on the file", () => {
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "# B",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/a.md");

    expect(impact).toEqual([]);
  });

  it("returns empty array for a file not in the graph", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/missing.md");

    expect(impact).toEqual([]);
  });

  it("handles diamond dependencies", () => {
    // a -> b, a -> c, b -> d, c -> d
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md) and [c](./c.md)",
      "/project/b.md": "[d](./d.md)",
      "/project/c.md": "[d](./d.md)",
      "/project/d.md": "# D",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/d.md");

    expect(impact).toEqual(["/project/a.md", "/project/b.md", "/project/c.md"]);
  });

  it("handles CJK file paths in impact set", () => {
    const docs = makeDocs({
      "/project/概要.md": "[要件](./要件.md)",
      "/project/要件.md": "[設計](./設計.md)",
      "/project/設計.md": "# 設計",
    });
    const graph = buildContextGraph(docs);
    const impact = getImpactSet(graph, "/project/設計.md");

    expect(impact).toEqual(["/project/概要.md", "/project/要件.md"]);
  });
});

// ---------------------------------------------------------------------------
// getContextSlice
// ---------------------------------------------------------------------------
describe("getContextSlice", () => {
  it("returns the file and its outgoing neighbors by file path", () => {
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "/project/a.md", 1);

    expect(slice).toEqual(["/project/a.md", "/project/b.md"]);
  });

  it("follows outgoing edges up to maxDepth", () => {
    // a -> b -> c -> d
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "[d](./d.md)",
      "/project/d.md": "# D",
    });
    const graph = buildContextGraph(docs);

    const depth1 = getContextSlice(graph, docs, "/project/a.md", 1);
    expect(depth1).toEqual(["/project/a.md", "/project/b.md"]);

    const depth2 = getContextSlice(graph, docs, "/project/a.md", 2);
    expect(depth2).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
    ]);

    const depth3 = getContextSlice(graph, docs, "/project/a.md", 3);
    expect(depth3).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
      "/project/d.md",
    ]);
  });

  it("finds files containing an ID in table cells", () => {
    const docs = makeDocs({
      "/project/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-001 | Auth |",
      "/project/design.md": "[req](./requirements.md)",
      "/project/unrelated.md": "# Nothing here",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "REQ-001", 1);

    expect(slice).toContain("/project/requirements.md");
  });

  it("returns empty array for a query that matches nothing", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "NONEXISTENT-ID");

    expect(slice).toEqual([]);
  });

  it("defaults to maxDepth 2", () => {
    // a -> b -> c -> d
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "[d](./d.md)",
      "/project/d.md": "# D",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "/project/a.md");

    // Default depth 2: a -> b -> c
    expect(slice).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
    ]);
  });

  it("finds CJK IDs in table cells", () => {
    const docs = makeDocs({
      "/project/要件.md":
        "| ID | 説明 |\n|---|---|\n| 認証-001 | ログイン機能 |",
      "/project/設計.md": "# 設計",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "認証-001");

    expect(slice).toContain("/project/要件.md");
  });

  it("expands from ID-matching file via edges", () => {
    const docs = makeDocs({
      "/project/requirements.md":
        "| ID | Name |\n|---|---|\n| REQ-001 | Auth |\n\n[design](./design.md)",
      "/project/design.md": "# Design\n\n[api](./api.md)",
      "/project/api.md": "# API",
    });
    const graph = buildContextGraph(docs);
    const slice = getContextSlice(graph, docs, "REQ-001", 2);

    expect(slice).toContain("/project/requirements.md");
    expect(slice).toContain("/project/design.md");
    expect(slice).toContain("/project/api.md");
  });
});

// ---------------------------------------------------------------------------
// topologicalSort
// ---------------------------------------------------------------------------
describe("topologicalSort", () => {
  it("returns correct order for a simple chain", () => {
    // a -> b -> c
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    expect(sorted).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
    ]);
  });

  it("handles a DAG with multiple roots", () => {
    // a -> c, b -> c
    const docs = makeDocs({
      "/project/a.md": "[c](./c.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    // a and b have no dependencies, c depends on both
    expect(sorted.indexOf("/project/a.md")).toBeLessThan(
      sorted.indexOf("/project/c.md"),
    );
    expect(sorted.indexOf("/project/b.md")).toBeLessThan(
      sorted.indexOf("/project/c.md"),
    );
  });

  it("handles disconnected nodes", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
      "/project/b.md": "# B",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    expect(sorted).toHaveLength(3);
    expect(sorted).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
    ]);
  });

  it("returns shorter array when cycles exist", () => {
    // a -> b -> a (cycle)
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[a](./a.md)",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    // Cycle means not all nodes can be sorted
    expect(sorted.length).toBeLessThan(2);
  });

  it("handles an empty graph", () => {
    const graph: ContextGraph = { nodes: [], edges: [] };
    const sorted = topologicalSort(graph);

    expect(sorted).toEqual([]);
  });

  it("handles single node with no edges", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    expect(sorted).toEqual(["/project/a.md"]);
  });

  it("handles complex DAG correctly", () => {
    // a -> b, a -> c, b -> d, c -> d
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md) [c](./c.md)",
      "/project/b.md": "[d](./d.md)",
      "/project/c.md": "[d](./d.md)",
      "/project/d.md": "# D",
    });
    const graph = buildContextGraph(docs);
    const sorted = topologicalSort(graph);

    expect(sorted).toHaveLength(4);
    expect(sorted.indexOf("/project/a.md")).toBeLessThan(
      sorted.indexOf("/project/b.md"),
    );
    expect(sorted.indexOf("/project/a.md")).toBeLessThan(
      sorted.indexOf("/project/c.md"),
    );
    expect(sorted.indexOf("/project/b.md")).toBeLessThan(
      sorted.indexOf("/project/d.md"),
    );
    expect(sorted.indexOf("/project/c.md")).toBeLessThan(
      sorted.indexOf("/project/d.md"),
    );
  });
});

// ---------------------------------------------------------------------------
// getComponents
// ---------------------------------------------------------------------------
describe("getComponents", () => {
  it("identifies separate clusters", () => {
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "# B",
      "/project/c.md": "[d](./d.md)",
      "/project/d.md": "# D",
    });
    const graph = buildContextGraph(docs);
    const components = getComponents(graph);

    expect(components).toHaveLength(2);
    expect(components[0]).toEqual(["/project/a.md", "/project/b.md"]);
    expect(components[1]).toEqual(["/project/c.md", "/project/d.md"]);
  });

  it("returns a single component for fully connected graph", () => {
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const components = getComponents(graph);

    expect(components).toHaveLength(1);
    expect(components[0]).toEqual([
      "/project/a.md",
      "/project/b.md",
      "/project/c.md",
    ]);
  });

  it("treats each isolated node as its own component", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
      "/project/b.md": "# B",
      "/project/c.md": "# C",
    });
    const graph = buildContextGraph(docs);
    const components = getComponents(graph);

    expect(components).toHaveLength(3);
    expect(components[0]).toEqual(["/project/a.md"]);
    expect(components[1]).toEqual(["/project/b.md"]);
    expect(components[2]).toEqual(["/project/c.md"]);
  });

  it("returns empty array for empty graph", () => {
    const graph: ContextGraph = { nodes: [], edges: [] };
    const components = getComponents(graph);

    expect(components).toEqual([]);
  });

  it("connects nodes via directed edges in undirected fashion", () => {
    // a -> b: in undirected view they are in the same component
    const docs = makeDocs({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "# B",
    });
    const graph = buildContextGraph(docs);
    const components = getComponents(graph);

    expect(components).toHaveLength(1);
    expect(components[0]).toEqual(["/project/a.md", "/project/b.md"]);
  });

  it("handles CJK file paths in components", () => {
    const docs = makeDocs({
      "/project/概要.md": "[要件](./要件.md)",
      "/project/要件.md": "# 要件",
      "/project/설계.md": "[구현](./구현.md)",
      "/project/구현.md": "# 구현",
    });
    const graph = buildContextGraph(docs);
    const components = getComponents(graph);

    expect(components).toHaveLength(2);

    // Find which component contains the Japanese files and which contains the Korean files
    const jaComponent = components.find((c) =>
      c.some((f) => f.includes("概要")),
    );
    const koComponent = components.find((c) =>
      c.some((f) => f.includes("설계")),
    );

    expect(jaComponent).toBeDefined();
    expect(jaComponent).toHaveLength(2);
    expect(jaComponent).toContain("/project/概要.md");
    expect(jaComponent).toContain("/project/要件.md");

    expect(koComponent).toBeDefined();
    expect(koComponent).toHaveLength(2);
    expect(koComponent).toContain("/project/설계.md");
    expect(koComponent).toContain("/project/구현.md");
  });
});

// ---------------------------------------------------------------------------
// formatContextGraphSummary
// ---------------------------------------------------------------------------
describe("formatContextGraphSummary", () => {
  it("formats a summary with entry points and most connected", () => {
    const docs = makeDocs({
      "/project/docs/index.md": "[a](./a.md)\n[b](./b.md)",
      "/project/docs/a.md": "[b](./b.md)",
      "/project/docs/b.md": "# B",
    });

    const graph = buildContextGraph(docs);
    const summary = formatContextGraphSummary(graph);

    expect(summary).toContain("Document Graph: 3 files, 3 edges");
    expect(summary).toContain("Entry points (no incoming refs):");
    expect(summary).toContain("/project/docs/index.md");
    expect(summary).toContain("Most connected (by incoming refs):");
    expect(summary).toContain("/project/docs/b.md (2 in, 0 out)");
  });

  it("formats an empty graph", () => {
    const documents = new Map<string, ParsedDocument>();
    const graph = buildContextGraph(documents);
    const summary = formatContextGraphSummary(graph);

    expect(summary).toBe("Document Graph: 0 files, 0 edges");
  });

  it("formats graph with no edges", () => {
    const docs = makeDocs({
      "/project/a.md": "# A",
      "/project/b.md": "# B",
    });

    const graph = buildContextGraph(docs);
    const summary = formatContextGraphSummary(graph);

    expect(summary).toContain("Document Graph: 2 files, 0 edges");
    expect(summary).toContain("Entry points (no incoming refs):");
    expect(summary).toContain("/project/a.md");
    expect(summary).toContain("/project/b.md");
    expect(summary).not.toContain("Most connected");
  });
});

// ---------------------------------------------------------------------------
// Mixed / integration tests
// ---------------------------------------------------------------------------
describe("integration", () => {
  it("works with a realistic multi-file project", () => {
    const docs = makeDocs({
      "/project/docs/overview.md":
        "[requirements](./requirements.md) and [design](./design.md)\n\n![arch](./images/architecture.png)",
      "/project/docs/requirements.md":
        "# Requirements\n\n| ID | Status |\n|---|---|\n| REQ-001 | draft |",
      "/project/docs/design.md":
        "[requirements](./requirements.md)\n\n[api](./api.md)",
      "/project/docs/api.md": "# API",
      "/project/docs/images/architecture.png": "",
    });
    const graph = buildContextGraph(docs);

    // overview -> requirements, overview -> design, overview -> architecture.png
    // design -> requirements, design -> api
    expect(graph.edges).toHaveLength(5);

    // Impact of changing requirements: overview and design depend on it
    const impact = getImpactSet(graph, "/project/docs/requirements.md");
    expect(impact).toContain("/project/docs/overview.md");
    expect(impact).toContain("/project/docs/design.md");

    // Context slice from overview at depth 1
    const slice = getContextSlice(graph, docs, "/project/docs/overview.md", 1);
    expect(slice).toContain("/project/docs/overview.md");
    expect(slice).toContain("/project/docs/requirements.md");
    expect(slice).toContain("/project/docs/design.md");
    expect(slice).toContain("/project/docs/images/architecture.png");

    // Topological sort
    const sorted = topologicalSort(graph);
    expect(sorted.indexOf("/project/docs/overview.md")).toBeLessThan(
      sorted.indexOf("/project/docs/requirements.md"),
    );

    // All connected
    const components = getComponents(graph);
    expect(components).toHaveLength(1);
  });

  it("works with a multilingual project", () => {
    const docs = makeDocs({
      "/project/docs/overview.md": "[ja](./概要.md) and [ko](./개요.md) and [zh](./概述.md)",
      "/project/docs/概要.md": "# 概要\n\n| ID | 説明 |\n|---|---|\n| 機能-001 | ログイン |",
      "/project/docs/개요.md": "# 개요\n\n| ID | 설명 |\n|---|---|\n| 기능-001 | 로그인 |",
      "/project/docs/概述.md": "# 概述\n\n| ID | 说明 |\n|---|---|\n| 功能-001 | 登录 |",
    });
    const graph = buildContextGraph(docs);

    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);

    // All files are connected via overview
    const components = getComponents(graph);
    expect(components).toHaveLength(1);

    // Find by Japanese ID
    const jaSlice = getContextSlice(graph, docs, "機能-001");
    expect(jaSlice).toContain("/project/docs/概要.md");

    // Find by Korean ID
    const koSlice = getContextSlice(graph, docs, "기능-001");
    expect(koSlice).toContain("/project/docs/개요.md");

    // Find by Chinese ID
    const zhSlice = getContextSlice(graph, docs, "功能-001");
    expect(zhSlice).toContain("/project/docs/概述.md");
  });
});
