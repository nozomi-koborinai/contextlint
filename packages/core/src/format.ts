import { relative } from "node:path";
import type { LintMessage, Severity } from "./rule.js";
import type { FileLintResult } from "./lint-files.js";
import type { ContextGraph } from "./context-graph.js";

export interface JsonLintEntry {
  file: string;
  line: number;
  severity: Severity;
  message: string;
  ruleId: string;
}

function summarize(errors: number, warnings: number): string {
  const parts: string[] = [];
  if (errors > 0) {
    parts.push(`${String(errors)} ${errors === 1 ? "error" : "errors"}`);
  }
  if (warnings > 0) {
    parts.push(`${String(warnings)} ${warnings === 1 ? "warning" : "warnings"}`);
  }
  return parts.join(", ");
}

export function formatContentResults(messages: LintMessage[]): string {
  if (messages.length === 0) {
    return "No issues found.";
  }

  const lines: string[] = [];

  for (const msg of messages) {
    const linePrefix = msg.line > 0 ? `  line ${String(msg.line)}` : "  ";
    lines.push(
      `${linePrefix}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
    );
  }

  const errors = messages.filter((m) => m.severity === "error").length;
  const warnings = messages.length - errors;

  lines.push("");
  lines.push(summarize(errors, warnings));

  return lines.join("\n");
}

export function formatFileResults(
  results: FileLintResult[],
  cwd: string,
): string {
  const filesWithIssues = results.filter((r) => r.messages.length > 0);

  if (filesWithIssues.length === 0) {
    return "No issues found.";
  }

  const lines: string[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of filesWithIssues) {
    const label =
      result.filePath === "<project>"
        ? "(project)"
        : relative(cwd, result.filePath);
    lines.push(label);

    for (const msg of result.messages) {
      const linePrefix = msg.line > 0 ? `  line ${String(msg.line)}` : "  ";
      lines.push(
        `${linePrefix}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
      );
      if (msg.severity === "error") {
        totalErrors++;
      } else {
        totalWarnings++;
      }
    }

    lines.push("");
  }

  const fileWord = filesWithIssues.length === 1 ? "file" : "files";
  lines.push(
    `${summarize(totalErrors, totalWarnings)} in ${String(filesWithIssues.length)} ${fileWord}`,
  );

  return lines.join("\n");
}

export function formatFileResultsJson(
  results: FileLintResult[],
  cwd: string,
): string {
  const entries: JsonLintEntry[] = [];

  for (const result of results) {
    const file =
      result.filePath === "<project>"
        ? "(project)"
        : relative(cwd, result.filePath);

    for (const msg of result.messages) {
      entries.push({
        file,
        line: msg.line,
        severity: msg.severity,
        message: msg.message,
        ruleId: msg.ruleId,
      });
    }
  }

  return JSON.stringify(entries, null, 2);
}

// ---------------------------------------------------------------------------
// Impact analysis formatters
// ---------------------------------------------------------------------------

/**
 * Format impact analysis results as human-readable text.
 */
export function formatImpactResult(
  impact: {
    directlyAffected: { file: string; references: number }[];
    transitivelyAffected: { file: string; via: string }[];
  },
  lintResults: FileLintResult[],
  readingOrder: string[],
  cwd: string,
): string {
  const lines: string[] = [];

  // Directly affected
  const directCount = impact.directlyAffected.length;
  const directWord = directCount === 1 ? "file" : "files";
  lines.push(`Directly affected (${String(directCount)} ${directWord}):`);
  for (const entry of impact.directlyAffected) {
    const rel = relative(cwd, entry.file);
    const refWord = entry.references === 1 ? "reference" : "references";
    lines.push(`  ${rel}  ${String(entry.references)} ${refWord}`);
  }

  // Transitively affected
  if (impact.transitivelyAffected.length > 0) {
    lines.push("");
    const transitiveCount = impact.transitivelyAffected.length;
    const transitiveWord = transitiveCount === 1 ? "file" : "files";
    lines.push(
      `Transitively affected (${String(transitiveCount)} ${transitiveWord}):`,
    );
    for (const entry of impact.transitivelyAffected) {
      const rel = relative(cwd, entry.file);
      const viaRel = relative(cwd, entry.via);
      lines.push(`  ${rel}  via ${viaRel}`);
    }
  }

  // Reading order
  if (readingOrder.length > 0) {
    lines.push("");
    lines.push("Reading order:");
    for (let i = 0; i < readingOrder.length; i++) {
      const file = readingOrder[i];
      if (!file) continue;
      const rel = relative(cwd, file);
      lines.push(`  ${String(i + 1)}. ${rel}`);
    }
  }

  // Lint check on affected files
  const affectedResults = lintResults.filter(
    (r) => r.filePath !== "<project>",
  );
  if (affectedResults.length > 0) {
    lines.push("");
    lines.push("Lint check on affected files:");
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const result of affectedResults) {
      const rel = relative(cwd, result.filePath);
      lines.push(`  ${rel}`);
      if (result.messages.length === 0) {
        lines.push("    No issues");
      } else {
        for (const msg of result.messages) {
          const linePrefix =
            msg.line > 0 ? `    line ${String(msg.line)}` : "    ";
          lines.push(
            `${linePrefix}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
          );
          if (msg.severity === "error") {
            totalErrors++;
          } else {
            totalWarnings++;
          }
        }
      }
    }

    lines.push("");
    lines.push(
      `1 file changed -> ${String(directCount)} directly affected -> ${String(impact.transitivelyAffected.length)} transitively affected`,
    );
    const total = totalErrors + totalWarnings;
    if (total > 0) {
      lines.push(`${summarize(totalErrors, totalWarnings)} in affected files`);
    } else {
      lines.push("No issues in affected files");
    }
  }

  return lines.join("\n");
}

/**
 * Format impact analysis results as JSON.
 */
export function formatImpactResultJson(
  changedFile: string,
  impact: {
    directlyAffected: { file: string; references: number }[];
    transitivelyAffected: { file: string; via: string }[];
  },
  lintResults: FileLintResult[],
  readingOrder: string[],
  cwd: string,
): string {
  const lintEntries: JsonLintEntry[] = [];
  for (const result of lintResults) {
    const file =
      result.filePath === "<project>"
        ? "(project)"
        : relative(cwd, result.filePath);
    for (const msg of result.messages) {
      lintEntries.push({
        file,
        line: msg.line,
        severity: msg.severity,
        message: msg.message,
        ruleId: msg.ruleId,
      });
    }
  }

  const output = {
    changedFile: relative(cwd, changedFile),
    directlyAffected: impact.directlyAffected.map((d) => ({
      file: relative(cwd, d.file),
      references: d.references,
    })),
    transitivelyAffected: impact.transitivelyAffected.map((t) => ({
      file: relative(cwd, t.file),
      via: relative(cwd, t.via),
    })),
    readingOrder: readingOrder.map((f) => relative(cwd, f)),
    lint: lintEntries,
  };

  return JSON.stringify(output, null, 2);
}

// ---------------------------------------------------------------------------
// Context slice formatters
// ---------------------------------------------------------------------------

/**
 * Format context slice results as human-readable text.
 */
export function formatSliceResult(
  query: string,
  files: string[],
  cwd: string,
): string {
  const lines: string[] = [];

  lines.push(`Context Slice: ${query}`);
  lines.push("");

  if (files.length === 0) {
    lines.push("No matching files found.");
    return lines.join("\n");
  }

  const fileWord = files.length === 1 ? "file" : "files";
  lines.push(`${String(files.length)} relevant ${fileWord}:`);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    const rel = relative(cwd, file);
    lines.push(`  ${String(i + 1)}. ${rel}`);
  }

  return lines.join("\n");
}

/**
 * Format context slice results as JSON.
 */
export function formatSliceResultJson(
  query: string,
  files: string[],
  cwd: string,
): string {
  const output = {
    query,
    files: files.map((f) => relative(cwd, f)),
  };
  return JSON.stringify(output, null, 2);
}

// ---------------------------------------------------------------------------
// Graph summary formatters
// ---------------------------------------------------------------------------

/**
 * Format graph summary as human-readable text.
 *
 * Includes entry points, hubs, clusters, and reading order with
 * cwd-relative paths.
 */
export function formatGraphResult(
  graph: ContextGraph,
  components: string[][],
  readingOrder: string[],
  cwd: string,
): string {
  const { nodes, edges } = graph;
  const lines: string[] = [];

  lines.push(
    `Document Graph: ${String(nodes.length)} files, ${String(edges.length)} edges`,
  );

  // Entry points: nodes with no incoming references
  const entryPoints = nodes.filter((n) => n.inDegree === 0);
  if (entryPoints.length > 0) {
    lines.push("");
    lines.push("Entry points (no incoming references):");
    for (const node of entryPoints) {
      lines.push(`  ${relative(cwd, node.filePath)}`);
    }
  }

  // Hubs: most referenced nodes (by inDegree)
  const hubs = nodes
    .filter((n) => n.inDegree > 0)
    .sort((a, b) => b.inDegree - a.inDegree);
  if (hubs.length > 0) {
    lines.push("");
    lines.push("Hubs (most referenced):");
    const top = hubs.slice(0, 5);
    for (const node of top) {
      const rel = relative(cwd, node.filePath);
      const fileWord = node.inDegree === 1 ? "file" : "files";
      lines.push(
        `  ${rel}  referenced by ${String(node.inDegree)} ${fileWord}`,
      );
    }
  }

  // Clusters
  if (components.length > 0) {
    lines.push("");
    lines.push("Clusters:");
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      if (!component) continue;
      const fileWord = component.length === 1 ? "file" : "files";
      // Find common prefix for display
      const relPaths = component.map((f) => relative(cwd, f));
      const prefix = findCommonPrefix(relPaths);
      const label = prefix ? `${prefix}*` : relPaths.join(", ");
      lines.push(
        `  Cluster ${String(i + 1)} (${String(component.length)} ${fileWord}): ${label}`,
      );
    }
  }

  // Reading order
  if (readingOrder.length > 0) {
    lines.push("");
    lines.push("Reading order:");
    for (let i = 0; i < readingOrder.length; i++) {
      const file = readingOrder[i];
      if (!file) continue;
      const rel = relative(cwd, file);
      lines.push(`  ${String(i + 1)}. ${rel}`);
    }
  }

  return lines.join("\n");
}

/**
 * Find the longest common directory prefix of a list of paths.
 * Returns the prefix ending with "/" or empty string if no common prefix.
 */
function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  const first = paths[0];
  if (!first) return "";
  if (paths.length === 1) {
    const lastSlash = first.lastIndexOf("/");
    return lastSlash > 0 ? first.substring(0, lastSlash + 1) : "";
  }

  let prefix = first;
  for (const p of paths) {
    while (prefix.length > 0 && !p.startsWith(prefix)) {
      const lastSlash = prefix.lastIndexOf("/");
      if (lastSlash <= 0) return "";
      prefix = prefix.substring(0, lastSlash + 1);
    }
  }

  // Only return if it ends with /
  if (prefix.endsWith("/")) return prefix;
  const lastSlash = prefix.lastIndexOf("/");
  return lastSlash > 0 ? prefix.substring(0, lastSlash + 1) : "";
}

/**
 * Format graph summary as JSON.
 */
export function formatGraphResultJson(
  graph: ContextGraph,
  components: string[][],
  readingOrder: string[],
  cwd: string,
): string {
  const output = {
    nodes: graph.nodes.map((n) => ({
      file: relative(cwd, n.filePath),
      inDegree: n.inDegree,
      outDegree: n.outDegree,
    })),
    edges: graph.edges.map((e) => ({
      source: relative(cwd, e.source),
      target: relative(cwd, e.target),
      type: e.type,
      line: e.line,
    })),
    components: components.map((c) => c.map((f) => relative(cwd, f))),
    readingOrder: readingOrder.map((f) => relative(cwd, f)),
  };
  return JSON.stringify(output, null, 2);
}
