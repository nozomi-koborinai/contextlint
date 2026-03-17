import { relative } from "node:path";
import type { ParsedDocument, ParsedTable } from "./parser.js";
import type { ContextGraph } from "./context-graph.js";
import type { RuleEntry } from "./lint-files.js";
import type { ContextlintConfig, CompilerConfig } from "./config.js";
import {
  buildContextGraph,
  topologicalSort,
  getComponents,
} from "./context-graph.js";
import { loadDocuments } from "./lint-files.js";
import { resolveRule } from "./registry.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeRole = "entry" | "hub" | "leaf" | "isolated" | "bridge";

export interface NodeClassification {
  roles: Map<string, NodeRole>;
  entries: string[];
  hubs: string[];
}

export interface GraphAnalysis {
  readingOrder: string[];
  components: string[][];
  classification: NodeClassification;
}

export interface OutlineEntry {
  text: string;
  level: number;
}

export interface TableSchema {
  section: string | null;
  columns: string[];
  rowCount: number;
  idPattern: string | null;
}

export interface DocProfile {
  filePath: string;
  role: NodeRole;
  outline: OutlineEntry[];
  tableSchemas: TableSchema[];
  referencesTo: string[];
  referencedBy: string[];
}

export interface RuleDescription {
  ruleId: string;
  scope: string | null;
  description: string;
}

export interface CompileResult {
  skillContent: string;
  metadata: {
    documentCount: number;
    ruleCount: number;
    componentCount: number;
  };
}

// ---------------------------------------------------------------------------
// Step 3: Graph Analysis
// ---------------------------------------------------------------------------

/**
 * Classify each node in the graph by its structural role.
 *
 * - entry: inDegree === 0 && outDegree > 0
 * - hub: inDegree >= 2
 * - leaf: outDegree === 0 && inDegree > 0
 * - isolated: inDegree === 0 && outDegree === 0
 * - bridge: everything else
 */
export function classifyNodes(graph: ContextGraph): NodeClassification {
  const roles = new Map<string, NodeRole>();
  const entries: string[] = [];
  const hubs: { path: string; inDegree: number }[] = [];

  for (const node of graph.nodes) {
    let role: NodeRole;
    if (node.inDegree >= 2) {
      role = "hub";
      hubs.push({ path: node.filePath, inDegree: node.inDegree });
    } else if (node.inDegree === 0 && node.outDegree > 0) {
      role = "entry";
      entries.push(node.filePath);
    } else if (node.outDegree === 0 && node.inDegree > 0) {
      role = "leaf";
    } else if (node.inDegree === 0 && node.outDegree === 0) {
      role = "isolated";
    } else {
      role = "bridge";
    }
    roles.set(node.filePath, role);
  }

  entries.sort();
  hubs.sort((a, b) => b.inDegree - a.inDegree);

  return {
    roles,
    entries,
    hubs: hubs.map((h) => h.path),
  };
}

export function analyzeGraph(graph: ContextGraph): GraphAnalysis {
  return {
    readingOrder: topologicalSort(graph),
    components: getComponents(graph),
    classification: classifyNodes(graph),
  };
}

// ---------------------------------------------------------------------------
// Step 4: Document Extraction
// ---------------------------------------------------------------------------

/**
 * Detect an ID pattern from a set of column values.
 *
 * Given values like ["REQ-001", "REQ-002", "REQ-003"], returns "REQ-NNN".
 * Pure string processing: splits each value into a non-digit prefix and
 * a trailing digit suffix, then checks consistency across all values.
 */
function detectIdPattern(values: string[]): string | null {
  const nonEmpty = values.filter((v) => v.length > 0);
  if (nonEmpty.length < 2) return null;

  // Split each value into prefix (non-digit or leading part) and numeric suffix.
  // Find trailing digit run for each value.
  const parts: { prefix: string; digitLen: number }[] = [];

  for (const val of nonEmpty) {
    const match = /^(.*\D)(\d+)$/.exec(val);
    if (!match) return null;
    const prefix = match[1];
    const digits = match[2];
    if (!prefix || !digits) return null;
    parts.push({ prefix, digitLen: digits.length });
  }

  // All prefixes must be the same
  const firstPart = parts[0];
  if (!firstPart) return null;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!part) return null;
    if (part.prefix !== firstPart.prefix) return null;
  }

  // Use the maximum digit length for the pattern
  let maxDigitLen = 0;
  for (const part of parts) {
    if (part.digitLen > maxDigitLen) {
      maxDigitLen = part.digitLen;
    }
  }

  return firstPart.prefix + "N".repeat(maxDigitLen);
}

export function extractDocProfile(
  filePath: string,
  doc: ParsedDocument,
  role: NodeRole,
  graph: ContextGraph,
): DocProfile {
  const outline: OutlineEntry[] = doc.headings.map((h) => ({
    text: h.text,
    level: h.level,
  }));

  const tableSchemas: TableSchema[] = doc.tables.map(
    (table: ParsedTable) => {
      // For each column, collect all values and try to detect ID pattern
      let idPattern: string | null = null;
      for (const col of table.headers) {
        const colValues = table.rows
          .map((row) => row[col] ?? "")
          .filter((v) => v.length > 0);
        const pattern = detectIdPattern(colValues);
        if (pattern) {
          idPattern = pattern;
          break;
        }
      }

      return {
        section: table.section,
        columns: [...table.headers],
        rowCount: table.rows.length,
        idPattern,
      };
    },
  );

  // Collect outgoing references
  const referencesTo: string[] = [];
  for (const edge of graph.edges) {
    if (edge.source === filePath && !referencesTo.includes(edge.target)) {
      referencesTo.push(edge.target);
    }
  }
  referencesTo.sort();

  // Collect incoming references
  const referencedBy: string[] = [];
  for (const edge of graph.edges) {
    if (edge.target === filePath && !referencedBy.includes(edge.source)) {
      referencedBy.push(edge.source);
    }
  }
  referencedBy.sort();

  return {
    filePath,
    role,
    outline,
    tableSchemas,
    referencesTo,
    referencedBy,
  };
}

// ---------------------------------------------------------------------------
// Step 5: Rule Extraction
// ---------------------------------------------------------------------------

type DescriberFn = (options: Record<string, unknown>) => string;

function describeTbl001(options: Record<string, unknown>): string {
  const cols = options["requiredColumns"] as string[] | undefined;
  const section = options["section"] as string | undefined;
  const files = options["files"] as string | undefined;
  const parts: string[] = [];
  if (cols) {
    parts.push(`Tables must contain columns: ${cols.map((c) => `"${c}"`).join(", ")}`);
  }
  if (section) {
    parts.push(`in section "${section}"`);
  }
  if (files) {
    parts.push(`(files: ${files})`);
  }
  return parts.join(" ");
}

function describeTbl002(options: Record<string, unknown>): string {
  const cols = options["columns"] as string[] | undefined;
  const files = options["files"] as string | undefined;
  const target = cols ? `columns ${cols.map((c) => `"${c}"`).join(", ")}` : "all columns";
  const scope = files ? ` (files: ${files})` : "";
  return `Table cells in ${target} must not be empty${scope}`;
}

function describeTbl003(options: Record<string, unknown>): string {
  const col = options["column"] as string | undefined;
  const values = options["values"] as string[] | undefined;
  const files = options["files"] as string | undefined;
  if (!col || !values) return "Cell values must be from an allowed list";
  const scope = files ? ` (files: ${files})` : "";
  return `Column "${col}" values must be one of: ${values.join(", ")}${scope}`;
}

function describeTbl004(options: Record<string, unknown>): string {
  const col = options["column"] as string | undefined;
  const pattern = options["pattern"] as string | undefined;
  const files = options["files"] as string | undefined;
  if (!col || !pattern) return "Cell values must match the specified pattern";
  const scope = files ? ` (files: ${files})` : "";
  return `Column "${col}" values must match pattern /${pattern}/${scope}`;
}

function describeTbl005(options: Record<string, unknown>): string {
  const when = options["when"] as Record<string, unknown> | undefined;
  const then_ = options["then"] as Record<string, unknown> | undefined;
  const files = options["files"] as string | undefined;
  if (!when || !then_) return "Cross-column conditional constraint";
  const whenCol = when["column"] as string | undefined;
  const thenCol = then_["column"] as string | undefined;
  const scope = files ? ` (files: ${files})` : "";
  return `When "${whenCol ?? "?"}" meets a condition, "${thenCol ?? "?"}" must satisfy a constraint${scope}`;
}

function describeTbl006(options: Record<string, unknown>): string {
  const files = options["files"] as string | undefined;
  const col = options["column"] as string | undefined;
  const pattern = options["idPattern"] as string | undefined;
  if (!files || !col) return "IDs must be unique across files";
  const patternPart = pattern ? ` matching /${pattern}/` : "";
  return `Column "${col}" IDs${patternPart} must be unique across files matching ${files}`;
}

function describeSec001(options: Record<string, unknown>): string {
  const sections = options["sections"] as string[] | undefined;
  const files = options["files"] as string | undefined;
  if (!sections) return "Required sections must exist";
  const scope = files ? ` (files: ${files})` : "";
  return `Documents must contain sections: ${sections.map((s) => `"${s}"`).join(", ")}${scope}`;
}

function describeSec002(options: Record<string, unknown>): string {
  const order = options["order"] as string[] | undefined;
  const files = options["files"] as string | undefined;
  if (!order) return "Sections must appear in the specified order";
  const scope = files ? ` (files: ${files})` : "";
  return `Sections must appear in order: ${order.map((s) => `"${s}"`).join(" -> ")}${scope}`;
}

function describeStr001(options: Record<string, unknown>): string {
  const files = options["files"] as string[] | undefined;
  if (!files) return "Required files must exist in the project";
  return `Project must contain files: ${files.join(", ")}`;
}

function describeRef001(options: Record<string, unknown>): string {
  const exclude = options["exclude"] as string[] | undefined;
  if (exclude && exclude.length > 0) {
    return `All relative Markdown links must resolve to existing files (excluding ${exclude.join(", ")})`;
  }
  return "All relative Markdown links must resolve to existing files";
}

function describeRef002(options: Record<string, unknown>): string {
  const defs = options["definitions"] as string | undefined;
  const refs = options["references"] as string[] | undefined;
  const idCol = options["idColumn"] as string | undefined;
  const pattern = options["idPattern"] as string | undefined;
  const parts: string[] = ["Cross-file ID traceability:"];
  if (defs) parts.push(`definitions in ${defs}`);
  if (refs) parts.push(`references in ${refs.join(", ")}`);
  if (idCol) parts.push(`ID column "${idCol}"`);
  if (pattern) parts.push(`pattern /${pattern}/`);
  return parts.join(" ");
}

function describeRef003(options: Record<string, unknown>): string {
  const stabCol = options["stabilityColumn"] as string | undefined;
  const stabOrder = options["stabilityOrder"] as string[] | undefined;
  if (!stabCol || !stabOrder) return "Stability consistency check";
  return `Stability in "${stabCol}" must not exceed dependency stability (order: ${stabOrder.join(" < ")})`;
}

function describeRef004(options: Record<string, unknown>): string {
  const zonesDir = options["zonesDir"] as string | undefined;
  const depSection = options["dependencySection"] as string | undefined;
  if (!zonesDir) return "Cross-zone links must be declared";
  return `Cross-zone links under "${zonesDir}" must be declared in "${depSection ?? "Dependencies"}" section`;
}

function describeRef005(options: Record<string, unknown>): string {
  const files = options["files"] as string | undefined;
  const scope = files ? ` (files: ${files})` : "";
  return `Anchor fragments must point to existing headings${scope}`;
}

function describeRef006(options: Record<string, unknown>): string {
  const exclude = options["exclude"] as string[] | undefined;
  if (exclude && exclude.length > 0) {
    return `Image references must point to existing files (excluding ${exclude.join(", ")})`;
  }
  return "Image references must point to existing files";
}

function describeChk001(options: Record<string, unknown>): string {
  const section = options["section"] as string | undefined;
  const files = options["files"] as string | undefined;
  const parts: string[] = ["All checklist items must be checked"];
  if (section) parts.push(`in section "${section}"`);
  if (files) parts.push(`(files: ${files})`);
  return parts.join(" ");
}

function describeCtx001(options: Record<string, unknown>): string {
  const section = options["section"] as string | undefined;
  const placeholders = options["placeholders"] as string[] | undefined;
  const files = options["files"] as string | undefined;
  const parts: string[] = ["Sections must contain meaningful content"];
  if (section) parts.push(`(section: "${section}")`);
  if (placeholders) parts.push(`(placeholders: ${placeholders.join(", ")})`);
  if (files) parts.push(`(files: ${files})`);
  return parts.join(" ");
}

function describeCtx002(options: Record<string, unknown>): string {
  const glossary = options["glossary"] as string | undefined;
  const termCol = options["termColumn"] as string | undefined;
  const aliasCol = options["aliasColumn"] as string | undefined;
  const files = options["files"] as string | undefined;
  const parts: string[] = ["Terms must match glossary definitions"];
  if (glossary) parts.push(`(glossary: ${glossary}`);
  if (termCol) parts.push(`term: "${termCol}"`);
  if (aliasCol) parts.push(`alias: "${aliasCol}")`);
  if (files) parts.push(`(files: ${files})`);
  return parts.join(" ");
}

function describeGrp001(options: Record<string, unknown>): string {
  const chain = options["chain"] as Array<Record<string, unknown>> | undefined;
  if (!chain) return "Traceability chain validation";
  const stages = chain.map((s) => {
    const stage = s["stage"];
    return typeof stage === "string" ? stage : "?";
  });
  return `IDs must be traceable through stages: ${stages.join(" -> ")}`;
}

function describeGrp002(options: Record<string, unknown>): string {
  const files = options["files"] as string | undefined;
  const exclude = options["exclude"] as string[] | undefined;
  const parts: string[] = ["Document reference graph must have no circular references"];
  if (files) parts.push(`(files: ${files})`);
  if (exclude) parts.push(`(excluding: ${exclude.join(", ")})`);
  return parts.join(" ");
}

function describeGrp003(options: Record<string, unknown>): string {
  const files = options["files"] as string | undefined;
  const entryPoints = options["entryPoints"] as string[] | undefined;
  const parts: string[] = ["Every document must have at least one incoming reference"];
  if (files) parts.push(`(files: ${files})`);
  if (entryPoints) parts.push(`(entry points: ${entryPoints.join(", ")})`);
  return parts.join(" ");
}

const DESCRIBERS: Record<string, DescriberFn> = {
  tbl001: describeTbl001,
  tbl002: describeTbl002,
  tbl003: describeTbl003,
  tbl004: describeTbl004,
  tbl005: describeTbl005,
  tbl006: describeTbl006,
  sec001: describeSec001,
  sec002: describeSec002,
  str001: describeStr001,
  ref001: describeRef001,
  ref002: describeRef002,
  ref003: describeRef003,
  ref004: describeRef004,
  ref005: describeRef005,
  ref006: describeRef006,
  chk001: describeChk001,
  ctx001: describeCtx001,
  ctx002: describeCtx002,
  grp001: describeGrp001,
  grp002: describeGrp002,
  grp003: describeGrp003,
};

export function describeRules(rules: RuleEntry[]): RuleDescription[] {
  return rules.map((entry) => {
    const describer = DESCRIBERS[entry.rule];
    const opts = entry.options ?? {};

    let description: string;
    if (describer) {
      description = describer(opts);
    } else {
      // Fallback: resolve the rule and use its description
      try {
        const rule = resolveRule(entry.rule, entry.options);
        description = rule.description;
      } catch {
        description = `Rule ${entry.rule}`;
      }
    }

    // Determine scope (files glob) from options
    const scope = (opts["files"] as string | undefined) ?? null;

    return {
      ruleId: entry.rule,
      scope,
      description,
    };
  });
}

// ---------------------------------------------------------------------------
// Step 6: Template Synthesis
// ---------------------------------------------------------------------------

/** Map rule ID prefixes to human-readable category names */
const RULE_CATEGORIES: Record<string, string> = {
  tbl: "Table Structure",
  sec: "Section Order",
  str: "Project Structure",
  ref: "References",
  chk: "Checklist",
  ctx: "Content Quality",
  grp: "Graph Integrity",
};

function getCategoryKey(ruleId: string): string {
  // Extract prefix: "tbl001" -> "tbl", "sec001" -> "sec"
  const match = /^([a-z]+)\d/.exec(ruleId);
  return match?.[1] ?? "other";
}

/** Format "tbl001" as "TBL-001" */
function formatRuleId(ruleId: string): string {
  const match = /^([a-z]+)(\d+)$/.exec(ruleId);
  if (!match) return ruleId.toUpperCase();
  const prefix = match[1];
  const number = match[2];
  if (!prefix || !number) return ruleId.toUpperCase();
  return `${prefix.toUpperCase()}-${number}`;
}

function getCategoryName(key: string): string {
  return RULE_CATEGORIES[key] ?? "Other";
}

function roleLabel(role: NodeRole): string {
  switch (role) {
    case "entry":
      return "entry point";
    case "hub":
      return "hub";
    case "leaf":
      return "leaf";
    case "isolated":
      return "isolated";
    case "bridge":
      return "bridge";
  }
}

function buildFileTree(
  profiles: DocProfile[],
  cwd: string,
): string {
  const lines: string[] = [];
  lines.push("| Path | Role |");
  lines.push("|------|------|");
  for (const profile of profiles) {
    const relPath = relative(cwd, profile.filePath).replace(/\\/g, "/");
    lines.push(`| \`${relPath}\` | ${roleLabel(profile.role)} |`);
  }
  return lines.join("\n");
}

function buildDocumentTypes(profiles: DocProfile[]): string {
  // Collect unique table schemas across all documents
  const typeMap = new Map<string, { columns: string[]; count: number; idPattern: string | null }>();

  for (const profile of profiles) {
    for (const schema of profile.tableSchemas) {
      const key = schema.columns.join(",");
      const existing = typeMap.get(key);
      if (existing) {
        existing.count++;
        if (!existing.idPattern && schema.idPattern) {
          existing.idPattern = schema.idPattern;
        }
      } else {
        typeMap.set(key, {
          columns: schema.columns,
          count: 1,
          idPattern: schema.idPattern,
        });
      }
    }
  }

  if (typeMap.size === 0) {
    return "No tables found in documents.";
  }

  const lines: string[] = [];
  for (const [, info] of typeMap) {
    const idPart = info.idPattern ? ` (ID format: \`${info.idPattern}\`)` : "";
    lines.push(`- **[${info.columns.join(", ")}]** - ${String(info.count)} table(s)${idPart}`);
  }
  return lines.join("\n");
}

function buildRulesSection(ruleDescriptions: RuleDescription[]): string {
  // Group by category
  const groups = new Map<string, RuleDescription[]>();
  for (const rd of ruleDescriptions) {
    const key = getCategoryKey(rd.ruleId);
    const list = groups.get(key);
    if (list) {
      list.push(rd);
    } else {
      groups.set(key, [rd]);
    }
  }

  // Sort category keys in a stable order
  const categoryOrder = ["tbl", "sec", "str", "ref", "chk", "ctx", "grp"];
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const sections: string[] = [];
  for (const key of sortedKeys) {
    const rules = groups.get(key);
    if (!rules || rules.length === 0) continue;
    sections.push(`### ${getCategoryName(key)}`);
    for (const rd of rules) {
      sections.push(`- **${formatRuleId(rd.ruleId)}**: ${rd.description}`);
    }
    sections.push("");
  }

  return sections.join("\n").trimEnd();
}

function buildWorkflowSection(): string {
  return `When creating or editing documents:

1. Identify which zone the document belongs to
2. Follow the required section order
3. Ensure all required columns exist in tables
4. Use valid ID formats
5. Verify cross-file references

When creating a new zone:

1. Create overview.md with required sections
2. Create requirements.md with ID format
3. Add zone-specific documents
4. Link all documents from the zone overview`;
}

export function synthesize(
  analysis: GraphAnalysis,
  profiles: DocProfile[],
  ruleDescriptions: RuleDescription[],
  config: CompilerConfig,
  cwd: string,
): CompileResult {
  const sections = config.sections ?? {};
  const showArchitecture = sections.architecture !== false;
  const showRules = sections.rules !== false;
  const showDependencies = sections.dependencies !== false;
  const showWorkflow = sections.workflow !== false;

  const lines: string[] = [];

  // Header
  lines.push("<!-- Generated by contextlint compile. Do not edit manually. -->");
  lines.push("<!-- To update, run: contextlint compile -->");
  lines.push("---");
  lines.push(`name: ${config.skill.name}`);
  lines.push(`description: "${config.skill.description}"`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${config.skill.name}`);
  lines.push("");
  lines.push(config.skill.description);

  // Document Architecture
  if (showArchitecture) {
    lines.push("");
    lines.push("## Document Architecture");
    lines.push("");
    lines.push("### File Tree");
    lines.push("");
    lines.push(buildFileTree(profiles, cwd));
    lines.push("");
    lines.push("### Document Types");
    lines.push("");
    lines.push(buildDocumentTypes(profiles));
  }

  // Document Rules
  if (showRules && ruleDescriptions.length > 0) {
    lines.push("");
    lines.push("## Document Rules");
    lines.push("");
    lines.push(buildRulesSection(ruleDescriptions));
  }

  // Document Dependencies
  if (showDependencies) {
    lines.push("");
    lines.push("## Document Dependencies");
    lines.push("");
    lines.push("### Impact Analysis (dynamic)");
    lines.push("!`npx contextlint impact $ARGUMENTS`");
    lines.push("");
    lines.push("### Related Documents (dynamic)");
    lines.push("!`npx contextlint slice $ARGUMENTS`");
  }

  // Workflow
  if (showWorkflow) {
    lines.push("");
    lines.push("## Workflow");
    lines.push("");
    lines.push(buildWorkflowSection());
  }

  // Trailing newline
  lines.push("");

  return {
    skillContent: lines.join("\n"),
    metadata: {
      documentCount: profiles.length,
      ruleCount: ruleDescriptions.length,
      componentCount: analysis.components.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Top-level entry point
// ---------------------------------------------------------------------------

/**
 * Compile a SKILL.md from documents and config.
 *
 * Like `lintFiles`, this is intentionally synchronous.
 */
export function compileContext(
  patterns: string[],
  config: ContextlintConfig,
  cwd: string,
): CompileResult {
  const compileConfig = config.compile;
  if (!compileConfig) {
    throw new Error("No compile configuration found in contextlint config");
  }

  // Step 1: Load & Parse
  const documents = loadDocuments(patterns, cwd);

  // Step 2: Graph Construction
  const graph = buildContextGraph(documents);

  // Step 3: Graph Analysis
  const analysis = analyzeGraph(graph);

  // Step 4: Doc Extraction
  const profiles: DocProfile[] = [];
  for (const [filePath, doc] of documents) {
    const role = analysis.classification.roles.get(filePath) ?? "isolated";
    profiles.push(extractDocProfile(filePath, doc, role, graph));
  }
  // Sort profiles by reading order if possible, otherwise alphabetical
  const orderIndex = new Map<string, number>();
  for (let i = 0; i < analysis.readingOrder.length; i++) {
    const path = analysis.readingOrder[i];
    if (path) {
      orderIndex.set(path, i);
    }
  }
  profiles.sort((a, b) => {
    const ai = orderIndex.get(a.filePath) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.get(b.filePath) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.filePath.localeCompare(b.filePath);
  });

  // Step 5: Rule Extraction
  const ruleDescriptions = describeRules(config.rules);

  // Step 6: Template Synthesis
  return synthesize(analysis, profiles, ruleDescriptions, compileConfig, cwd);
}
