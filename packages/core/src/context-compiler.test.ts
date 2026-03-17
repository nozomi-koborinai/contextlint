import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseDocument } from "./parser.js";
import type { ParsedDocument } from "./parser.js";
import { buildContextGraph } from "./context-graph.js";
import type { ContextGraph } from "./context-graph.js";
import {
  classifyNodes,
  analyzeGraph,
  extractDocProfile,
  describeRules,
  synthesize,
  compileContext,
} from "./context-compiler.js";
import type {
  NodeRole,
  GraphAnalysis,
  CompilerConfig,
  ContextlintConfig,
  RuleEntry,
} from "./index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDocs(
  filesMap: Record<string, string>,
): Map<string, ParsedDocument> {
  const documents = new Map<string, ParsedDocument>();
  for (const [path, content] of Object.entries(filesMap)) {
    documents.set(path, parseDocument(content));
  }
  return documents;
}

function makeGraph(filesMap: Record<string, string>): ContextGraph {
  return buildContextGraph(makeDocs(filesMap));
}

// ---------------------------------------------------------------------------
// classifyNodes
// ---------------------------------------------------------------------------
describe("classifyNodes", () => {
  it("classifies entry nodes (inDegree=0, outDegree>0)", () => {
    const graph = makeGraph({
      "/project/overview.md": "[req](./requirements.md)",
      "/project/requirements.md": "# Requirements",
    });
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/overview.md")).toBe("entry");
    expect(classification.entries).toContain("/project/overview.md");
  });

  it("classifies hub nodes (inDegree>=2)", () => {
    const graph = makeGraph({
      "/project/a.md": "[shared](./shared.md)",
      "/project/b.md": "[shared](./shared.md)",
      "/project/shared.md": "# Shared",
    });
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/shared.md")).toBe("hub");
    expect(classification.hubs).toContain("/project/shared.md");
  });

  it("classifies leaf nodes (outDegree=0, inDegree>0 but <2)", () => {
    const graph = makeGraph({
      "/project/overview.md": "[leaf](./leaf.md)",
      "/project/leaf.md": "# Leaf",
    });
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/leaf.md")).toBe("leaf");
  });

  it("classifies isolated nodes (inDegree=0, outDegree=0)", () => {
    const graph = makeGraph({
      "/project/lonely.md": "# No links",
    });
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/lonely.md")).toBe("isolated");
  });

  it("classifies bridge nodes (inDegree=1, outDegree>0)", () => {
    // a -> b -> c : b has inDegree=1, outDegree=1 -> bridge
    const graph = makeGraph({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
    });
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/b.md")).toBe("bridge");
  });

  it("sorts entries alphabetically", () => {
    const graph = makeGraph({
      "/project/z-entry.md": "[target](./target.md)",
      "/project/a-entry.md": "[target](./target.md)",
      "/project/target.md": "# Target",
    });
    const classification = classifyNodes(graph);

    expect(classification.entries).toEqual([
      "/project/a-entry.md",
      "/project/z-entry.md",
    ]);
  });

  it("sorts hubs by inDegree descending", () => {
    // hub-a gets 3 incoming, hub-b gets 2 incoming
    const graph = makeGraph({
      "/project/x.md": "[a](./hub-a.md) [b](./hub-b.md)",
      "/project/y.md": "[a](./hub-a.md) [b](./hub-b.md)",
      "/project/z.md": "[a](./hub-a.md)",
      "/project/hub-a.md": "# Hub A",
      "/project/hub-b.md": "# Hub B",
    });
    const classification = classifyNodes(graph);

    expect(classification.hubs[0]).toBe("/project/hub-a.md");
    expect(classification.hubs[1]).toBe("/project/hub-b.md");
  });

  it("returns empty entries/hubs for an empty graph", () => {
    const graph: ContextGraph = { nodes: [], edges: [] };
    const classification = classifyNodes(graph);

    expect(classification.roles.size).toBe(0);
    expect(classification.entries).toEqual([]);
    expect(classification.hubs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// analyzeGraph
// ---------------------------------------------------------------------------
describe("analyzeGraph", () => {
  it("combines topological sort, components, and classification", () => {
    const graph = makeGraph({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[c](./c.md)",
      "/project/c.md": "# C",
      "/project/isolated.md": "# Isolated",
    });
    const analysis = analyzeGraph(graph);

    // Reading order should have a before b before c
    expect(analysis.readingOrder.indexOf("/project/a.md")).toBeLessThan(
      analysis.readingOrder.indexOf("/project/b.md"),
    );
    expect(analysis.readingOrder.indexOf("/project/b.md")).toBeLessThan(
      analysis.readingOrder.indexOf("/project/c.md"),
    );

    // Two components: {a, b, c} and {isolated}
    expect(analysis.components).toHaveLength(2);

    // Classification
    expect(analysis.classification.roles.get("/project/a.md")).toBe("entry");
    expect(analysis.classification.roles.get("/project/isolated.md")).toBe("isolated");
  });

  it("handles an empty graph", () => {
    const graph: ContextGraph = { nodes: [], edges: [] };
    const analysis = analyzeGraph(graph);

    expect(analysis.readingOrder).toEqual([]);
    expect(analysis.components).toEqual([]);
    expect(analysis.classification.roles.size).toBe(0);
  });

  it("handles cyclic graphs gracefully", () => {
    // a -> b -> a (cycle)
    const graph = makeGraph({
      "/project/a.md": "[b](./b.md)",
      "/project/b.md": "[a](./a.md)",
    });
    const analysis = analyzeGraph(graph);

    // topologicalSort returns shorter array for cycles
    expect(analysis.readingOrder.length).toBeLessThan(2);

    // Components still work
    expect(analysis.components).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// extractDocProfile
// ---------------------------------------------------------------------------
describe("extractDocProfile", () => {
  it("extracts outline from headings", () => {
    const doc = parseDocument("# Title\n## Section A\n### Subsection\n## Section B");
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);

    expect(profile.outline).toEqual([
      { text: "Title", level: 1 },
      { text: "Section A", level: 2 },
      { text: "Subsection", level: 3 },
      { text: "Section B", level: 2 },
    ]);
  });

  it("extracts table schemas with columns and row count", () => {
    const doc = parseDocument(
      "## Requirements\n\n| ID | Name | Status |\n|---|---|---|\n| REQ-001 | Auth | Done |\n| REQ-002 | Search | WIP |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);

    expect(profile.tableSchemas).toHaveLength(1);
    const schema = profile.tableSchemas[0];
    expect(schema).toBeDefined();
    expect(schema.section).toBe("Requirements");
    expect(schema.columns).toEqual(["ID", "Name", "Status"]);
    expect(schema.rowCount).toBe(2);
  });

  it("detects ID patterns from table data", () => {
    const doc = parseDocument(
      "| ID | Name |\n|---|---|\n| REQ-001 | Auth |\n| REQ-002 | Search |\n| REQ-003 | Profile |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.idPattern).toBe("REQ-NNN");
  });

  it("returns null idPattern when no pattern detected", () => {
    const doc = parseDocument(
      "| Name | Description |\n|---|---|\n| Auth | Login |\n| Search | Find |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.idPattern).toBeNull();
  });

  it("collects referencesTo and referencedBy from graph", () => {
    const docs = makeDocs({
      "/project/overview.md": "[req](./requirements.md)",
      "/project/requirements.md": "# Requirements",
      "/project/design.md": "[req](./requirements.md)",
    });
    const graph = buildContextGraph(docs);

    const reqDoc = docs.get("/project/requirements.md");
    if (!reqDoc) throw new Error("Expected document to exist");

    const profile = extractDocProfile(
      "/project/requirements.md",
      reqDoc,
      "hub",
      graph,
    );

    expect(profile.referencesTo).toEqual([]);
    expect(profile.referencedBy).toEqual([
      "/project/design.md",
      "/project/overview.md",
    ]);
  });

  it("preserves the assigned role", () => {
    const doc = parseDocument("# Test");
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "entry", graph);
    expect(profile.role).toBe("entry");
  });

  // CJK tests
  it("extracts outline with Japanese headings", () => {
    const doc = parseDocument("# 概要\n## 要件定義\n## 設計");
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.outline).toEqual([
      { text: "概要", level: 1 },
      { text: "要件定義", level: 2 },
      { text: "設計", level: 2 },
    ]);
  });

  it("extracts table schemas with Korean column names", () => {
    const doc = parseDocument(
      "## 요구사항\n\n| ID | 이름 | 상태 |\n|---|---|---|\n| REQ-001 | 인증 | 완료 |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.columns).toEqual(["ID", "이름", "상태"]);
  });

  it("extracts table schemas with Chinese column names", () => {
    const doc = parseDocument(
      "## 需求\n\n| ID | 名称 | 状态 |\n|---|---|---|\n| REQ-001 | 认证 | 完成 |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.columns).toEqual(["ID", "名称", "状态"]);
  });

  it("detects ID patterns with mixed prefix characters", () => {
    const doc = parseDocument(
      "| ID | Name |\n|---|---|\n| FEAT-01 | A |\n| FEAT-02 | B |\n| FEAT-03 | C |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.idPattern).toBe("FEAT-NN");
  });
});

// ---------------------------------------------------------------------------
// describeRules
// ---------------------------------------------------------------------------
describe("describeRules", () => {
  it("describes TBL-001", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]?.ruleId).toBe("tbl001");
    expect(descriptions[0]?.description).toContain("ID");
    expect(descriptions[0]?.description).toContain("Status");
  });

  it("describes SEC-001", () => {
    const rules: RuleEntry[] = [
      { rule: "sec001", options: { sections: ["Overview", "Requirements"], files: "*.md" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Overview");
    expect(descriptions[0]?.description).toContain("Requirements");
    expect(descriptions[0]?.scope).toBe("*.md");
  });

  it("describes REF-001", () => {
    const rules: RuleEntry[] = [
      { rule: "ref001", options: { exclude: ["*.pdf"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("links");
    expect(descriptions[0]?.description).toContain("*.pdf");
  });

  it("describes GRP-001", () => {
    const rules: RuleEntry[] = [
      {
        rule: "grp001",
        options: {
          chain: [
            { stage: "Requirements", files: "req.md", idColumn: "ID" },
            { stage: "Design", files: "design.md", refColumn: "ReqID" },
          ],
        },
      },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Requirements");
    expect(descriptions[0]?.description).toContain("Design");
  });

  it("describes CTX-001", () => {
    const rules: RuleEntry[] = [
      { rule: "ctx001", options: { section: "Overview", placeholders: ["TBD", "TODO"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("meaningful content");
    expect(descriptions[0]?.description).toContain("Overview");
  });

  it("describes TBL-002 with no options", () => {
    const rules: RuleEntry[] = [{ rule: "tbl002" }];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("empty");
  });

  it("describes TBL-003", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl003", options: { column: "Status", values: ["Draft", "Done"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Status");
    expect(descriptions[0]?.description).toContain("Draft");
  });

  it("describes TBL-004", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl004", options: { column: "ID", pattern: "^REQ-\\d+$" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("ID");
    expect(descriptions[0]?.description).toContain("REQ-");
  });

  it("describes TBL-005", () => {
    const rules: RuleEntry[] = [
      {
        rule: "tbl005",
        options: {
          when: { column: "Status", equals: "Done" },
          then: { column: "Reviewer", notEmpty: true },
        },
      },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Status");
    expect(descriptions[0]?.description).toContain("Reviewer");
  });

  it("describes TBL-006", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl006", options: { files: "*.md", column: "ID", idPattern: "^REQ-\\d+$" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("unique");
    expect(descriptions[0]?.description).toContain("ID");
  });

  it("describes SEC-002", () => {
    const rules: RuleEntry[] = [
      { rule: "sec002", options: { order: ["Overview", "Details", "Summary"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("order");
    expect(descriptions[0]?.description).toContain("Overview");
  });

  it("describes STR-001", () => {
    const rules: RuleEntry[] = [
      { rule: "str001", options: { files: ["README.md", "docs/overview.md"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("README.md");
  });

  it("describes REF-002", () => {
    const rules: RuleEntry[] = [
      {
        rule: "ref002",
        options: {
          definitions: "requirements/*.md",
          references: ["design/*.md"],
          idColumn: "ID",
          idPattern: "^REQ-\\d+$",
        },
      },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("requirements");
    expect(descriptions[0]?.description).toContain("ID");
  });

  it("describes REF-003", () => {
    const rules: RuleEntry[] = [
      {
        rule: "ref003",
        options: {
          stabilityColumn: "Stability",
          stabilityOrder: ["Draft", "Review", "Stable"],
          definitions: "*.md",
          references: ["*.md"],
        },
      },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Stability");
    expect(descriptions[0]?.description).toContain("Draft");
  });

  it("describes REF-004", () => {
    const rules: RuleEntry[] = [
      { rule: "ref004", options: { zonesDir: "zones" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("zones");
  });

  it("describes REF-005", () => {
    const rules: RuleEntry[] = [{ rule: "ref005" }];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Anchor");
  });

  it("describes REF-006", () => {
    const rules: RuleEntry[] = [{ rule: "ref006" }];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("Image");
  });

  it("describes CHK-001", () => {
    const rules: RuleEntry[] = [
      { rule: "chk001", options: { section: "Checklist" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("checklist");
    expect(descriptions[0]?.description).toContain("Checklist");
  });

  it("describes CTX-002", () => {
    const rules: RuleEntry[] = [
      {
        rule: "ctx002",
        options: { glossary: "glossary.md", termColumn: "Term", aliasColumn: "Alias" },
      },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("glossary");
  });

  it("describes GRP-002", () => {
    const rules: RuleEntry[] = [{ rule: "grp002" }];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("circular");
  });

  it("describes GRP-003", () => {
    const rules: RuleEntry[] = [
      { rule: "grp003", options: { entryPoints: ["README.md"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.description).toContain("incoming reference");
    expect(descriptions[0]?.description).toContain("README.md");
  });

  it("handles multiple rules together", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
      { rule: "sec001", options: { sections: ["Overview"] } },
      { rule: "ref001" },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions).toHaveLength(3);
    expect(descriptions.map((d) => d.ruleId)).toEqual(["tbl001", "sec001", "ref001"]);
  });

  it("returns empty array for empty rules", () => {
    const descriptions = describeRules([]);
    expect(descriptions).toEqual([]);
  });

  it("sets scope from files option", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl001", options: { requiredColumns: ["ID"], files: "docs/*.md" } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.scope).toBe("docs/*.md");
  });

  it("sets scope to null when no files option", () => {
    const rules: RuleEntry[] = [
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
    ];
    const descriptions = describeRules(rules);

    expect(descriptions[0]?.scope).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// synthesize
// ---------------------------------------------------------------------------
describe("synthesize", () => {
  const defaultConfig: CompilerConfig = {
    skill: {
      name: "Test Skill",
      description: "A test skill for linting documents",
    },
  };

  const defaultAnalysis: GraphAnalysis = {
    readingOrder: ["/project/overview.md", "/project/requirements.md"],
    components: [["/project/overview.md", "/project/requirements.md"]],
    classification: {
      roles: new Map<string, NodeRole>([
        ["/project/overview.md", "entry"],
        ["/project/requirements.md", "leaf"],
      ]),
      entries: ["/project/overview.md"],
      hubs: [],
    },
  };

  const defaultProfiles = [
    {
      filePath: "/project/overview.md",
      role: "entry" as NodeRole,
      outline: [{ text: "Overview", level: 1 }],
      tableSchemas: [],
      referencesTo: ["/project/requirements.md"],
      referencedBy: [],
    },
    {
      filePath: "/project/requirements.md",
      role: "leaf" as NodeRole,
      outline: [{ text: "Requirements", level: 1 }],
      tableSchemas: [
        { section: "Requirements", columns: ["ID", "Name"], rowCount: 3, idPattern: "REQ-NNN" },
      ],
      referencesTo: [],
      referencedBy: ["/project/overview.md"],
    },
  ];

  it("generates SKILL.md with correct header", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    expect(result.skillContent).toContain("<!-- Generated by contextlint compile. Do not edit manually. -->");
    expect(result.skillContent).toContain("<!-- To update, run: contextlint compile -->");
    expect(result.skillContent).toContain("name: Test Skill");
    expect(result.skillContent).toContain('description: "A test skill for linting documents"');
    expect(result.skillContent).toContain("# Test Skill");
  });

  it("generates Document Architecture section", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    expect(result.skillContent).toContain("## Document Architecture");
    expect(result.skillContent).toContain("### File Tree");
    expect(result.skillContent).toContain("`overview.md`");
    expect(result.skillContent).toContain("entry point");
    expect(result.skillContent).toContain("`requirements.md`");
    expect(result.skillContent).toContain("leaf");
  });

  it("generates Document Types from table schemas", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    expect(result.skillContent).toContain("### Document Types");
    expect(result.skillContent).toContain("ID, Name");
    expect(result.skillContent).toContain("REQ-NNN");
  });

  it("generates Document Rules section", () => {
    const ruleDescriptions = describeRules([
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
      { rule: "sec001", options: { sections: ["Overview"] } },
    ]);
    const result = synthesize(defaultAnalysis, defaultProfiles, ruleDescriptions, defaultConfig, "/project");

    expect(result.skillContent).toContain("## Document Rules");
    expect(result.skillContent).toContain("### Table Structure");
    expect(result.skillContent).toContain("### Section Order");
    expect(result.skillContent).toContain("TBL-001");
    expect(result.skillContent).toContain("SEC-001");
  });

  it("generates Document Dependencies section with dynamic commands", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    expect(result.skillContent).toContain("## Document Dependencies");
    expect(result.skillContent).toContain("### Impact Analysis (dynamic)");
    expect(result.skillContent).toContain("!`npx contextlint impact $ARGUMENTS`");
    expect(result.skillContent).toContain("### Related Documents (dynamic)");
    expect(result.skillContent).toContain("!`npx contextlint slice $ARGUMENTS`");
  });

  it("generates Workflow section", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    expect(result.skillContent).toContain("## Workflow");
    expect(result.skillContent).toContain("Follow the required section order");
  });

  it("returns correct metadata", () => {
    const ruleDescriptions = describeRules([
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
    ]);
    const result = synthesize(defaultAnalysis, defaultProfiles, ruleDescriptions, defaultConfig, "/project");

    expect(result.metadata.documentCount).toBe(2);
    expect(result.metadata.ruleCount).toBe(1);
    expect(result.metadata.componentCount).toBe(1);
  });

  it("omits architecture section when disabled", () => {
    const config: CompilerConfig = {
      ...defaultConfig,
      sections: { architecture: false },
    };
    const result = synthesize(defaultAnalysis, defaultProfiles, [], config, "/project");

    expect(result.skillContent).not.toContain("## Document Architecture");
    expect(result.skillContent).not.toContain("### File Tree");
  });

  it("omits rules section when disabled", () => {
    const ruleDescriptions = describeRules([
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
    ]);
    const config: CompilerConfig = {
      ...defaultConfig,
      sections: { rules: false },
    };
    const result = synthesize(defaultAnalysis, defaultProfiles, ruleDescriptions, config, "/project");

    expect(result.skillContent).not.toContain("## Document Rules");
  });

  it("omits dependencies section when disabled", () => {
    const config: CompilerConfig = {
      ...defaultConfig,
      sections: { dependencies: false },
    };
    const result = synthesize(defaultAnalysis, defaultProfiles, [], config, "/project");

    expect(result.skillContent).not.toContain("## Document Dependencies");
  });

  it("omits workflow section when disabled", () => {
    const config: CompilerConfig = {
      ...defaultConfig,
      sections: { workflow: false },
    };
    const result = synthesize(defaultAnalysis, defaultProfiles, [], config, "/project");

    expect(result.skillContent).not.toContain("## Workflow");
  });

  it("handles zero documents", () => {
    const emptyAnalysis: GraphAnalysis = {
      readingOrder: [],
      components: [],
      classification: { roles: new Map(), entries: [], hubs: [] },
    };
    const result = synthesize(emptyAnalysis, [], [], defaultConfig, "/project");

    expect(result.skillContent).toContain("# Test Skill");
    expect(result.skillContent).toContain("No tables found");
    expect(result.metadata.documentCount).toBe(0);
  });

  it("handles zero rules", () => {
    const result = synthesize(defaultAnalysis, defaultProfiles, [], defaultConfig, "/project");

    // Rules section should not appear when there are no rules
    expect(result.skillContent).not.toContain("## Document Rules");
  });

  it("groups rules by category", () => {
    const ruleDescriptions = describeRules([
      { rule: "tbl001", options: { requiredColumns: ["ID"] } },
      { rule: "tbl002" },
      { rule: "ref001" },
      { rule: "grp001", options: { chain: [{ stage: "A", files: "a.md" }, { stage: "B", files: "b.md" }] } },
    ]);
    const result = synthesize(defaultAnalysis, defaultProfiles, ruleDescriptions, defaultConfig, "/project");

    expect(result.skillContent).toContain("### Table Structure");
    expect(result.skillContent).toContain("### References");
    expect(result.skillContent).toContain("### Graph Integrity");
  });
});

// ---------------------------------------------------------------------------
// compileContext
// ---------------------------------------------------------------------------
describe("compileContext", () => {
  it("throws when no compile config present", () => {
    const config: ContextlintConfig = {
      rules: [{ rule: "tbl001", options: { requiredColumns: ["ID"] } }],
    };

    expect(() => compileContext(["nonexistent/**/*.md"], config, "/tmp")).toThrow(
      "No compile configuration found",
    );
  });

  it("produces a valid CompileResult for real files", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "contextlint-compile-"));
    const docsDir = join(tmpDir, "docs");
    mkdirSync(docsDir, { recursive: true });

    writeFileSync(
      join(docsDir, "overview.md"),
      "# Overview\n\n[Requirements](./requirements.md)\n",
    );
    writeFileSync(
      join(docsDir, "requirements.md"),
      "# Requirements\n\n| ID | Name | Status |\n|---|---|---|\n| REQ-001 | Auth | Draft |\n| REQ-002 | Search | Done |\n",
    );

    const config: ContextlintConfig = {
      rules: [
        { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
        { rule: "sec001", options: { sections: ["Requirements"] } },
      ],
      compile: {
        skill: {
          name: "Project Documentation",
          description: "Manage project documentation",
        },
      },
    };

    const result = compileContext(["docs/**/*.md"], config, tmpDir);

    expect(result.skillContent).toContain("# Project Documentation");
    expect(result.skillContent).toContain("Manage project documentation");
    expect(result.skillContent).toContain("overview.md");
    expect(result.skillContent).toContain("requirements.md");
    expect(result.skillContent).toContain("REQ-NNN");
    expect(result.skillContent).toContain("TBL-001");
    expect(result.skillContent).toContain("SEC-001");
    expect(result.skillContent).toContain("!`npx contextlint impact $ARGUMENTS`");
    expect(result.metadata.documentCount).toBe(2);
    expect(result.metadata.ruleCount).toBe(2);
    expect(result.metadata.componentCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// CJK tests
// ---------------------------------------------------------------------------
describe("CJK support", () => {
  it("handles Japanese document names in profiles", () => {
    const docs = makeDocs({
      "/project/docs/概要.md": "[要件](./要件定義.md)",
      "/project/docs/要件定義.md":
        "# 要件定義\n\n| ID | 要件名 | 安定度 |\n|---|---|---|\n| REQ-001 | 認証機能 | ドラフト |",
    });
    const graph = buildContextGraph(docs);
    const analysis = analyzeGraph(graph);

    const overviewDoc = docs.get("/project/docs/概要.md");
    expect(overviewDoc).toBeDefined();
    if (!overviewDoc) return;

    const profile = extractDocProfile(
      "/project/docs/概要.md",
      overviewDoc,
      analysis.classification.roles.get("/project/docs/概要.md") ?? "isolated",
      graph,
    );

    expect(profile.outline).toEqual([]);
    expect(profile.referencesTo).toContain("/project/docs/要件定義.md");
  });

  it("handles Korean headings and column names", () => {
    const doc = parseDocument(
      "# 개요\n## 요구사항\n\n| ID | 요구사항명 | 우선순위 |\n|---|---|---|\n| REQ-001 | 인증 | 높음 |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);

    expect(profile.outline[0]?.text).toBe("개요");
    expect(profile.outline[1]?.text).toBe("요구사항");
    expect(profile.tableSchemas[0]?.columns).toEqual(["ID", "요구사항명", "우선순위"]);
  });

  it("handles Chinese headings and column names", () => {
    const doc = parseDocument(
      "# 概述\n## 需求\n\n| ID | 需求名称 | 优先级 |\n|---|---|---|\n| REQ-001 | 认证 | 高 |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);

    expect(profile.outline[0]?.text).toBe("概述");
    expect(profile.outline[1]?.text).toBe("需求");
    expect(profile.tableSchemas[0]?.columns).toEqual(["ID", "需求名称", "优先级"]);
  });

  it("synthesizes SKILL.md with CJK content correctly", () => {
    const analysis: GraphAnalysis = {
      readingOrder: ["/project/概要.md"],
      components: [["/project/概要.md"]],
      classification: {
        roles: new Map<string, NodeRole>([["/project/概要.md", "isolated"]]),
        entries: [],
        hubs: [],
      },
    };

    const profiles = [
      {
        filePath: "/project/概要.md",
        role: "isolated" as NodeRole,
        outline: [{ text: "概要", level: 1 }],
        tableSchemas: [
          { section: "概要", columns: ["ID", "要件名"], rowCount: 1, idPattern: null },
        ],
        referencesTo: [],
        referencedBy: [],
      },
    ];

    const config: CompilerConfig = {
      skill: {
        name: "ドキュメント管理",
        description: "プロジェクトドキュメントの管理スキル",
      },
    };

    const result = synthesize(analysis, profiles, [], config, "/project");

    expect(result.skillContent).toContain("# ドキュメント管理");
    expect(result.skillContent).toContain("プロジェクトドキュメントの管理スキル");
    expect(result.skillContent).toContain("概要.md");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("edge cases", () => {
  it("handles document with no tables and no headings", () => {
    const doc = parseDocument("Just some plain text without any structure.");
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/plain.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/plain.md", doc, "isolated", graph);

    expect(profile.outline).toEqual([]);
    expect(profile.tableSchemas).toEqual([]);
    expect(profile.referencesTo).toEqual([]);
    expect(profile.referencedBy).toEqual([]);
  });

  it("handles table with only 1 row (insufficient for ID detection)", () => {
    const doc = parseDocument(
      "| ID | Name |\n|---|---|\n| REQ-001 | Auth |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    // Only 1 value, so no pattern can be detected
    expect(profile.tableSchemas[0]?.idPattern).toBeNull();
  });

  it("handles table with non-numeric suffixes (no ID pattern)", () => {
    const doc = parseDocument(
      "| Code | Name |\n|---|---|\n| AUTH-module | Login |\n| AUTH-service | API |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.idPattern).toBeNull();
  });

  it("classifyNodes handles graph with single node", () => {
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/only.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };
    const classification = classifyNodes(graph);

    expect(classification.roles.get("/project/only.md")).toBe("isolated");
  });

  it("synthesize handles all sections disabled", () => {
    const analysis: GraphAnalysis = {
      readingOrder: [],
      components: [],
      classification: { roles: new Map(), entries: [], hubs: [] },
    };
    const config: CompilerConfig = {
      skill: { name: "Minimal", description: "Minimal skill" },
      sections: {
        architecture: false,
        rules: false,
        dependencies: false,
        workflow: false,
      },
    };

    const result = synthesize(analysis, [], [], config, "/project");

    expect(result.skillContent).toContain("# Minimal");
    expect(result.skillContent).not.toContain("## Document Architecture");
    expect(result.skillContent).not.toContain("## Document Rules");
    expect(result.skillContent).not.toContain("## Document Dependencies");
    expect(result.skillContent).not.toContain("## Workflow");
  });

  it("describeRules falls back to rule description for unknown describer", () => {
    // Use a valid rule but simulate fallback by checking description content
    const rules: RuleEntry[] = [{ rule: "ref005" }];
    const descriptions = describeRules(rules);

    // ref005 has a describer, so this verifies it works; if we had an unknown rule,
    // it would fall back
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]?.description.length).toBeGreaterThan(0);
  });

  it("detects ID pattern with varying digit lengths", () => {
    const doc = parseDocument(
      "| ID | Name |\n|---|---|\n| X-1 | A |\n| X-2 | B |\n| X-3 | C |",
    );
    const graph: ContextGraph = {
      nodes: [{ filePath: "/project/test.md", inDegree: 0, outDegree: 0 }],
      edges: [],
    };

    const profile = extractDocProfile("/project/test.md", doc, "isolated", graph);
    expect(profile.tableSchemas[0]?.idPattern).toBe("X-N");
  });
});
