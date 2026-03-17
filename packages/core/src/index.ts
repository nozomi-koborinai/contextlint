export { parseDocument } from "./parser.js";
export type {
  ParsedCheckItem,
  ParsedHeading,
  ParsedImage,
  ParsedLink,
  ParsedTable,
  ParsedDocument,
} from "./parser.js";

export { runRules } from "./rule.js";
export type {
  Severity,
  LintMessage,
  RuleContext,
  Rule,
  RunOptions,
} from "./rule.js";

export { tbl001, tbl001Schema } from "./rules/tbl-001.js";
export type { Tbl001Options } from "./rules/tbl-001.js";

export { tbl002, tbl002Schema } from "./rules/tbl-002.js";
export type { Tbl002Options } from "./rules/tbl-002.js";

export { tbl003, tbl003Schema } from "./rules/tbl-003.js";
export type { Tbl003Options } from "./rules/tbl-003.js";

export { str001, str001Schema } from "./rules/str-001.js";
export type { Str001Options } from "./rules/str-001.js";

export { sec001, sec001Schema } from "./rules/sec-001.js";
export type { Sec001Options } from "./rules/sec-001.js";

export { sec002, sec002Schema } from "./rules/sec-002.js";
export type { Sec002Options } from "./rules/sec-002.js";

export { tbl004, tbl004Schema } from "./rules/tbl-004.js";
export type { Tbl004Options } from "./rules/tbl-004.js";

export { tbl005, tbl005Schema } from "./rules/tbl-005.js";
export type {
  Tbl005Options,
  Tbl005Condition,
  Tbl005Constraint,
} from "./rules/tbl-005.js";

export { tbl006, tbl006Schema } from "./rules/tbl-006.js";
export type { Tbl006Options } from "./rules/tbl-006.js";

export { ref001, ref001Schema } from "./rules/ref-001.js";

export { ref002, ref002Schema } from "./rules/ref-002.js";
export type { Ref002Options } from "./rules/ref-002.js";

export { ref003, ref003Schema } from "./rules/ref-003.js";
export type { Ref003Options } from "./rules/ref-003.js";

export { ref004, ref004Schema } from "./rules/ref-004.js";
export type { Ref004Options } from "./rules/ref-004.js";

export { ref005, ref005Schema } from "./rules/ref-005.js";
export type { Ref005Options } from "./rules/ref-005.js";

export { ref006, ref006Schema } from "./rules/ref-006.js";
export type { Ref006Options } from "./rules/ref-006.js";

export { chk001, chk001Schema } from "./rules/chk-001.js";
export type { Chk001Options } from "./rules/chk-001.js";

export { ctx001, ctx001Schema } from "./rules/ctx-001.js";
export type { Ctx001Options } from "./rules/ctx-001.js";

export { ctx002, ctx002Schema } from "./rules/ctx-002.js";
export type { Ctx002Options } from "./rules/ctx-002.js";

export { grp001, grp001Schema } from "./rules/grp-001.js";
export type { Grp001Options } from "./rules/grp-001.js";

export { grp002, grp002Schema } from "./rules/grp-002.js";
export type { Grp002Options } from "./rules/grp-002.js";

export { grp003, grp003Schema } from "./rules/grp-003.js";
export type { Grp003Options } from "./rules/grp-003.js";

export { resolveRule, ruleNames } from "./registry.js";

export { lintFiles, loadDocuments } from "./lint-files.js";
export type {
  RuleEntry,
  LintFilesConfig,
  FileLintResult,
} from "./lint-files.js";

export { findConfig, loadConfig } from "./config.js";
export type { ContextlintConfig, CompilerConfig } from "./config.js";

export {
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
export type { JsonLintEntry } from "./format.js";

export {
  buildContextGraph,
  getImpactSet,
  getContextSlice,
  topologicalSort,
  getComponents,
  formatContextGraphSummary,
  classifyImpact,
  formatImpactSummary,
  relativizeImpact,
} from "./context-graph.js";
export type { ContextGraph, GraphNode, GraphEdge } from "./context-graph.js";

export { extractSectionBody } from "./utils/extract-section-body.js";

export {
  classifyNodes,
  analyzeGraph,
  extractDocProfile,
  describeRules,
  synthesize,
  compileContext,
} from "./context-compiler.js";
export type {
  NodeRole,
  NodeClassification,
  GraphAnalysis,
  OutlineEntry,
  TableSchema,
  DocProfile,
  RuleDescription,
  CompileResult,
} from "./context-compiler.js";
