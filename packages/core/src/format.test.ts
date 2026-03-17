import { describe, it, expect } from "bun:test";
import {
  formatFileResults,
  formatFileResultsJson,
  formatContentResults,
  formatImpactResult,
  formatImpactResultJson,
  formatSliceResult,
  formatSliceResultJson,
  formatGraphResult,
  formatGraphResultJson,
} from "./format.js";
import type { FileLintResult } from "./lint-files.js";
import type { ContextGraph } from "./context-graph.js";

// ---------------------------------------------------------------------------
// Existing formatters
// ---------------------------------------------------------------------------

describe("formatContentResults", () => {
  it("returns no-issues message for empty results", () => {
    expect(formatContentResults([])).toBe("No issues found.");
  });

  it("formats a single warning", () => {
    const output = formatContentResults([
      { line: 5, severity: "warning", message: "Test issue", ruleId: "TST-001" },
    ]);
    expect(output).toContain("line 5");
    expect(output).toContain("warning");
    expect(output).toContain("Test issue");
    expect(output).toContain("TST-001");
    expect(output).toContain("1 warning");
  });
});

describe("formatFileResults", () => {
  it("returns no-issues message when all files are clean", () => {
    const results: FileLintResult[] = [
      { filePath: "/project/a.md", messages: [] },
    ];
    expect(formatFileResults(results, "/project")).toBe("No issues found.");
  });

  it("formats file paths relative to cwd", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/docs/spec.md",
        messages: [
          { line: 10, severity: "error", message: "Missing column", ruleId: "TBL-001" },
        ],
      },
    ];
    const output = formatFileResults(results, "/project");
    expect(output).toContain("docs/spec.md");
    expect(output).toContain("1 error");
  });
});

describe("formatFileResultsJson", () => {
  it("returns valid JSON array", () => {
    const results: FileLintResult[] = [
      {
        filePath: "/project/docs/spec.md",
        messages: [
          { line: 3, severity: "warning", message: "Empty cell", ruleId: "TBL-002" },
        ],
      },
    ];
    const output = formatFileResultsJson(results, "/project");
    const parsed: unknown = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatImpactResult
// ---------------------------------------------------------------------------

describe("formatImpactResult", () => {
  it("formats directly affected files", () => {
    const impact = {
      directlyAffected: [
        { file: "/project/docs/design.md", references: 3 },
        { file: "/project/docs/test-plan.md", references: 1 },
      ],
      transitivelyAffected: [],
    };
    const lint: FileLintResult[] = [];
    const order = ["/project/docs/requirements.md", "/project/docs/design.md"];
    const output = formatImpactResult(impact, lint, order, "/project");

    expect(output).toContain("Directly affected (2 files):");
    expect(output).toContain("docs/design.md");
    expect(output).toContain("3 references");
    expect(output).toContain("docs/test-plan.md");
    expect(output).toContain("1 reference");
  });

  it("formats transitively affected files", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/design.md", references: 2 }],
      transitivelyAffected: [
        { file: "/project/docs/api-spec.md", via: "/project/docs/design.md" },
      ],
    };
    const lint: FileLintResult[] = [];
    const order: string[] = [];
    const output = formatImpactResult(impact, lint, order, "/project");

    expect(output).toContain("Transitively affected (1 file):");
    expect(output).toContain("docs/api-spec.md");
    expect(output).toContain("via docs/design.md");
  });

  it("formats reading order", () => {
    const impact = { directlyAffected: [], transitivelyAffected: [] };
    const lint: FileLintResult[] = [];
    const order = [
      "/project/docs/requirements.md",
      "/project/docs/design.md",
      "/project/docs/api.md",
    ];
    const output = formatImpactResult(impact, lint, order, "/project");

    expect(output).toContain("Reading order:");
    expect(output).toContain("1. docs/requirements.md");
    expect(output).toContain("2. docs/design.md");
    expect(output).toContain("3. docs/api.md");
  });

  it("formats lint results on affected files", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/design.md", references: 1 }],
      transitivelyAffected: [],
    };
    const lint: FileLintResult[] = [
      {
        filePath: "/project/docs/design.md",
        messages: [
          {
            line: 15,
            severity: "warning",
            message: "REQ-005 referenced but not defined",
            ruleId: "REF-002",
          },
        ],
      },
      {
        filePath: "/project/docs/test-plan.md",
        messages: [],
      },
    ];
    const order: string[] = [];
    const output = formatImpactResult(impact, lint, order, "/project");

    expect(output).toContain("Lint check on affected files:");
    expect(output).toContain("docs/design.md");
    expect(output).toContain("line 15");
    expect(output).toContain("REF-002");
    expect(output).toContain("docs/test-plan.md");
    expect(output).toContain("No issues");
    expect(output).toContain("1 warning in affected files");
  });

  it("shows no-issues message when lint is clean", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/design.md", references: 1 }],
      transitivelyAffected: [],
    };
    const lint: FileLintResult[] = [
      { filePath: "/project/docs/design.md", messages: [] },
    ];
    const order: string[] = [];
    const output = formatImpactResult(impact, lint, order, "/project");

    expect(output).toContain("No issues in affected files");
  });

  it("uses singular 'file' when count is 1", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/a.md", references: 1 }],
      transitivelyAffected: [],
    };
    const output = formatImpactResult(impact, [], [], "/project");
    expect(output).toContain("Directly affected (1 file):");
  });

  // --- CJK content ---

  it("handles Japanese file paths", () => {
    const impact = {
      directlyAffected: [
        { file: "/project/docs/設計.md", references: 2 },
      ],
      transitivelyAffected: [
        { file: "/project/docs/実装.md", via: "/project/docs/設計.md" },
      ],
    };
    const output = formatImpactResult(impact, [], [], "/project");
    expect(output).toContain("docs/設計.md");
    expect(output).toContain("docs/実装.md");
    expect(output).toContain("via docs/設計.md");
  });

  it("handles Korean file paths", () => {
    const impact = {
      directlyAffected: [
        { file: "/project/docs/설계.md", references: 1 },
      ],
      transitivelyAffected: [],
    };
    const output = formatImpactResult(impact, [], [], "/project");
    expect(output).toContain("docs/설계.md");
  });

  it("handles Chinese file paths", () => {
    const impact = {
      directlyAffected: [
        { file: "/project/docs/设计.md", references: 1 },
      ],
      transitivelyAffected: [],
    };
    const output = formatImpactResult(impact, [], [], "/project");
    expect(output).toContain("docs/设计.md");
  });
});

// ---------------------------------------------------------------------------
// formatImpactResultJson
// ---------------------------------------------------------------------------

describe("formatImpactResultJson", () => {
  it("returns valid JSON with all fields", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/design.md", references: 2 }],
      transitivelyAffected: [
        { file: "/project/docs/api.md", via: "/project/docs/design.md" },
      ],
    };
    const lint: FileLintResult[] = [
      {
        filePath: "/project/docs/design.md",
        messages: [
          { line: 5, severity: "warning" as const, message: "Issue", ruleId: "TST-001" },
        ],
      },
    ];
    const order = ["/project/docs/requirements.md", "/project/docs/design.md"];
    const output = formatImpactResultJson(
      "/project/docs/requirements.md",
      impact,
      lint,
      order,
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;

    expect(parsed).toHaveProperty("changedFile", "docs/requirements.md");
    expect(parsed).toHaveProperty("directlyAffected");
    expect(parsed).toHaveProperty("transitivelyAffected");
    expect(parsed).toHaveProperty("readingOrder");
    expect(parsed).toHaveProperty("lint");
  });

  it("relativizes all paths", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/a.md", references: 1 }],
      transitivelyAffected: [],
    };
    const output = formatImpactResultJson(
      "/project/docs/changed.md",
      impact,
      [],
      ["/project/docs/changed.md"],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("changedFile", "docs/changed.md");
    const da = parsed["directlyAffected"] as { file: string }[];
    expect(da[0]?.file).toBe("docs/a.md");
  });

  // --- CJK content ---

  it("handles Japanese paths in JSON output", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/設計.md", references: 1 }],
      transitivelyAffected: [],
    };
    const output = formatImpactResultJson(
      "/project/docs/要件.md",
      impact,
      [],
      [],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("changedFile", "docs/要件.md");
  });

  it("handles Korean paths in JSON output", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/설계.md", references: 1 }],
      transitivelyAffected: [],
    };
    const output = formatImpactResultJson(
      "/project/docs/요구사항.md",
      impact,
      [],
      [],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("changedFile", "docs/요구사항.md");
  });

  it("handles Chinese paths in JSON output", () => {
    const impact = {
      directlyAffected: [{ file: "/project/docs/设计.md", references: 1 }],
      transitivelyAffected: [],
    };
    const output = formatImpactResultJson(
      "/project/docs/需求.md",
      impact,
      [],
      [],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("changedFile", "docs/需求.md");
  });
});

// ---------------------------------------------------------------------------
// formatSliceResult
// ---------------------------------------------------------------------------

describe("formatSliceResult", () => {
  it("formats a list of relevant files", () => {
    const files = [
      "/project/docs/requirements.md",
      "/project/docs/design.md",
      "/project/docs/api.md",
    ];
    const output = formatSliceResult("REQ-001", files, "/project");

    expect(output).toContain("Context Slice: REQ-001");
    expect(output).toContain("3 relevant files:");
    expect(output).toContain("1. docs/requirements.md");
    expect(output).toContain("2. docs/design.md");
    expect(output).toContain("3. docs/api.md");
  });

  it("shows no-match message for empty results", () => {
    const output = formatSliceResult("MISSING-ID", [], "/project");
    expect(output).toContain("Context Slice: MISSING-ID");
    expect(output).toContain("No matching files found.");
  });

  it("uses singular 'file' when count is 1", () => {
    const output = formatSliceResult("REQ-001", ["/project/a.md"], "/project");
    expect(output).toContain("1 relevant file:");
  });

  // --- CJK content ---

  it("handles Japanese query and file paths", () => {
    const files = ["/project/docs/要件.md", "/project/docs/設計.md"];
    const output = formatSliceResult("認証-001", files, "/project");
    expect(output).toContain("Context Slice: 認証-001");
    expect(output).toContain("docs/要件.md");
    expect(output).toContain("docs/設計.md");
  });

  it("handles Korean query and file paths", () => {
    const files = ["/project/docs/요구사항.md"];
    const output = formatSliceResult("인증-001", files, "/project");
    expect(output).toContain("Context Slice: 인증-001");
    expect(output).toContain("docs/요구사항.md");
  });

  it("handles Chinese query and file paths", () => {
    const files = ["/project/docs/需求.md"];
    const output = formatSliceResult("认证-001", files, "/project");
    expect(output).toContain("Context Slice: 认证-001");
    expect(output).toContain("docs/需求.md");
  });
});

// ---------------------------------------------------------------------------
// formatSliceResultJson
// ---------------------------------------------------------------------------

describe("formatSliceResultJson", () => {
  it("returns valid JSON with query and files", () => {
    const files = ["/project/docs/a.md", "/project/docs/b.md"];
    const output = formatSliceResultJson("REQ-001", files, "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;

    expect(parsed).toHaveProperty("query", "REQ-001");
    expect(parsed).toHaveProperty("files");
    const fileList = parsed["files"] as string[];
    expect(fileList).toEqual(["docs/a.md", "docs/b.md"]);
  });

  it("returns empty file list for no matches", () => {
    const output = formatSliceResultJson("NOTHING", [], "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed["files"]).toEqual([]);
  });

  // --- CJK content ---

  it("handles Japanese in JSON output", () => {
    const output = formatSliceResultJson(
      "認証-001",
      ["/project/docs/要件.md"],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("query", "認証-001");
    const fileList = parsed["files"] as string[];
    expect(fileList).toEqual(["docs/要件.md"]);
  });

  it("handles Korean in JSON output", () => {
    const output = formatSliceResultJson(
      "인증-001",
      ["/project/docs/요구사항.md"],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("query", "인증-001");
  });

  it("handles Chinese in JSON output", () => {
    const output = formatSliceResultJson(
      "认证-001",
      ["/project/docs/需求.md"],
      "/project",
    );
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty("query", "认证-001");
  });
});

// ---------------------------------------------------------------------------
// formatGraphResult
// ---------------------------------------------------------------------------

describe("formatGraphResult", () => {
  function makeGraph(
    nodesData: { filePath: string; inDegree: number; outDegree: number }[],
    edgesData: { source: string; target: string; type: "link" | "image"; line: number }[],
  ): ContextGraph {
    return { nodes: nodesData, edges: edgesData };
  }

  it("formats basic graph summary", () => {
    const graph = makeGraph(
      [
        { filePath: "/project/docs/overview.md", inDegree: 0, outDegree: 2 },
        { filePath: "/project/docs/requirements.md", inDegree: 2, outDegree: 0 },
        { filePath: "/project/docs/design.md", inDegree: 1, outDegree: 1 },
      ],
      [
        { source: "/project/docs/overview.md", target: "/project/docs/requirements.md", type: "link", line: 1 },
        { source: "/project/docs/overview.md", target: "/project/docs/design.md", type: "link", line: 2 },
        { source: "/project/docs/design.md", target: "/project/docs/requirements.md", type: "link", line: 1 },
      ],
    );
    const components = [
      ["/project/docs/design.md", "/project/docs/overview.md", "/project/docs/requirements.md"],
    ];
    const order = [
      "/project/docs/overview.md",
      "/project/docs/design.md",
      "/project/docs/requirements.md",
    ];
    const output = formatGraphResult(graph, components, order, "/project");

    expect(output).toContain("Document Graph: 3 files, 3 edges");
    expect(output).toContain("Entry points (no incoming references):");
    expect(output).toContain("docs/overview.md");
    expect(output).toContain("Hubs (most referenced):");
    expect(output).toContain("docs/requirements.md");
    expect(output).toContain("referenced by 2 files");
    expect(output).toContain("Clusters:");
    expect(output).toContain("Cluster 1");
    expect(output).toContain("Reading order:");
    expect(output).toContain("1. docs/overview.md");
  });

  it("formats empty graph", () => {
    const graph = makeGraph([], []);
    const output = formatGraphResult(graph, [], [], "/project");
    expect(output).toContain("Document Graph: 0 files, 0 edges");
  });

  it("uses singular forms correctly", () => {
    const graph = makeGraph(
      [
        { filePath: "/project/a.md", inDegree: 0, outDegree: 1 },
        { filePath: "/project/b.md", inDegree: 1, outDegree: 0 },
      ],
      [
        { source: "/project/a.md", target: "/project/b.md", type: "link", line: 1 },
      ],
    );
    const output = formatGraphResult(
      graph,
      [["/project/a.md", "/project/b.md"]],
      ["/project/a.md", "/project/b.md"],
      "/project",
    );
    expect(output).toContain("referenced by 1 file");
  });

  // --- CJK content ---

  it("handles Japanese file paths", () => {
    const graph = makeGraph(
      [
        { filePath: "/project/docs/概要.md", inDegree: 0, outDegree: 1 },
        { filePath: "/project/docs/要件.md", inDegree: 1, outDegree: 0 },
      ],
      [
        { source: "/project/docs/概要.md", target: "/project/docs/要件.md", type: "link", line: 1 },
      ],
    );
    const components = [["/project/docs/概要.md", "/project/docs/要件.md"]];
    const order = ["/project/docs/概要.md", "/project/docs/要件.md"];
    const output = formatGraphResult(graph, components, order, "/project");

    expect(output).toContain("docs/概要.md");
    expect(output).toContain("docs/要件.md");
  });

  it("handles Korean file paths", () => {
    const graph = makeGraph(
      [
        { filePath: "/project/docs/개요.md", inDegree: 0, outDegree: 1 },
        { filePath: "/project/docs/요구사항.md", inDegree: 1, outDegree: 0 },
      ],
      [
        { source: "/project/docs/개요.md", target: "/project/docs/요구사항.md", type: "link", line: 1 },
      ],
    );
    const output = formatGraphResult(
      graph,
      [["/project/docs/개요.md", "/project/docs/요구사항.md"]],
      [],
      "/project",
    );
    expect(output).toContain("docs/개요.md");
    expect(output).toContain("docs/요구사항.md");
  });

  it("handles Chinese file paths", () => {
    const graph = makeGraph(
      [
        { filePath: "/project/docs/概述.md", inDegree: 0, outDegree: 1 },
        { filePath: "/project/docs/需求.md", inDegree: 1, outDegree: 0 },
      ],
      [
        { source: "/project/docs/概述.md", target: "/project/docs/需求.md", type: "link", line: 1 },
      ],
    );
    const output = formatGraphResult(
      graph,
      [["/project/docs/概述.md", "/project/docs/需求.md"]],
      [],
      "/project",
    );
    expect(output).toContain("docs/概述.md");
    expect(output).toContain("docs/需求.md");
  });
});

// ---------------------------------------------------------------------------
// formatGraphResultJson
// ---------------------------------------------------------------------------

describe("formatGraphResultJson", () => {
  it("returns valid JSON with all fields", () => {
    const graph: ContextGraph = {
      nodes: [
        { filePath: "/project/a.md", inDegree: 0, outDegree: 1 },
        { filePath: "/project/b.md", inDegree: 1, outDegree: 0 },
      ],
      edges: [
        { source: "/project/a.md", target: "/project/b.md", type: "link", line: 1 },
      ],
    };
    const components = [["/project/a.md", "/project/b.md"]];
    const order = ["/project/a.md", "/project/b.md"];
    const output = formatGraphResultJson(graph, components, order, "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;

    expect(parsed).toHaveProperty("nodes");
    expect(parsed).toHaveProperty("edges");
    expect(parsed).toHaveProperty("components");
    expect(parsed).toHaveProperty("readingOrder");

    const nodes = parsed["nodes"] as { file: string }[];
    expect(nodes[0]?.file).toBe("a.md");
    expect(nodes[1]?.file).toBe("b.md");

    const edges = parsed["edges"] as { source: string; target: string }[];
    expect(edges[0]?.source).toBe("a.md");
    expect(edges[0]?.target).toBe("b.md");
  });

  it("returns empty arrays for empty graph", () => {
    const graph: ContextGraph = { nodes: [], edges: [] };
    const output = formatGraphResultJson(graph, [], [], "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed["nodes"]).toEqual([]);
    expect(parsed["edges"]).toEqual([]);
    expect(parsed["components"]).toEqual([]);
    expect(parsed["readingOrder"]).toEqual([]);
  });

  // --- CJK content ---

  it("handles Japanese paths in JSON", () => {
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/docs/要件.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };
    const output = formatGraphResultJson(graph, [["/project/docs/要件.md"]], [], "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    const nodes = parsed["nodes"] as { file: string }[];
    expect(nodes[0]?.file).toBe("docs/要件.md");
  });

  it("handles Korean paths in JSON", () => {
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/docs/요구사항.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };
    const output = formatGraphResultJson(graph, [["/project/docs/요구사항.md"]], [], "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    const nodes = parsed["nodes"] as { file: string }[];
    expect(nodes[0]?.file).toBe("docs/요구사항.md");
  });

  it("handles Chinese paths in JSON", () => {
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/docs/需求.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };
    const output = formatGraphResultJson(graph, [["/project/docs/需求.md"]], [], "/project");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    const nodes = parsed["nodes"] as { file: string }[];
    expect(nodes[0]?.file).toBe("docs/需求.md");
  });
});
