import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { globSync } from "glob";
import { parseDocument } from "./parser.js";
import type { ParsedDocument } from "./parser.js";
import type { LintMessage } from "./rule.js";
import { runRules } from "./rule.js";
import { resolveRule } from "./registry.js";

export interface RuleEntry {
  rule: string;
  options?: Record<string, unknown>;
}

export interface LintFilesConfig {
  rules: RuleEntry[];
}

export interface FileLintResult {
  filePath: string;
  messages: LintMessage[];
}

/**
 * Resolve glob patterns, read matched files, and parse them into documents.
 * Returns the parsed document map keyed by absolute file path.
 */
export function loadDocuments(
  patterns: string[],
  cwd: string,
): Map<string, ParsedDocument> {
  const rawFiles = globSync(patterns, { cwd, absolute: true, nodir: true });
  const files = rawFiles.map((f) => f.replace(/\\/g, "/"));
  files.sort();

  const documents = new Map<string, ParsedDocument>();
  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    documents.set(filePath, parseDocument(content));
  }
  return documents;
}

export function lintFiles(
  patterns: string[],
  config: LintFilesConfig,
  cwd: string,
): FileLintResult[] {
  const rules = config.rules.map((entry) =>
    resolveRule(entry.rule, entry.options),
  );

  const docRules = rules.filter((r) => (r.scope ?? "document") === "document");
  const projectRules = rules.filter((r) => r.scope === "project");

  const documents = loadDocuments(patterns, cwd);
  const files = [...documents.keys()];

  const projectFiles = files.map((f) => relative(cwd, f).replace(/\\/g, "/"));

  // Buckets: one per scanned file + optional `<project>` for project-scope
  // messages that don't carry a concrete filePath. Initialize all scanned
  // files with empty arrays so we return an entry per file (matches the
  // prior lintFiles contract; callers like formatImpactResult rely on
  // per-file entries existing even when no issues were found).
  const perFile = new Map<string, LintMessage[]>();
  for (const filePath of files) {
    perFile.set(filePath, []);
  }

  const addToBucket = (key: string, msg: LintMessage): void => {
    const arr = perFile.get(key) ?? [];
    arr.push(msg);
    perFile.set(key, arr);
  };

  if (projectRules.length > 0) {
    const emptyDoc = parseDocument("");
    const messages = runRules(projectRules, emptyDoc, "<project>", {
      projectFiles,
      documents,
    });
    for (const msg of messages) {
      addToBucket(msg.filePath ?? "<project>", msg);
    }
  }

  for (const filePath of files) {
    const document = documents.get(filePath);
    if (!document) continue;
    const messages = runRules(docRules, document, filePath, { documents });
    for (const msg of messages) {
      addToBucket(filePath, msg);
    }
  }

  const results: FileLintResult[] = [];
  const projectMessages = perFile.get("<project>");
  if (projectMessages && projectMessages.length > 0) {
    results.push({ filePath: "<project>", messages: projectMessages });
  }
  for (const filePath of files) {
    const msgs = perFile.get(filePath) ?? [];
    results.push({ filePath, messages: msgs });
  }
  for (const [filePath, msgs] of perFile) {
    if (filePath === "<project>" || files.includes(filePath)) continue;
    if (msgs.length > 0) {
      results.push({ filePath, messages: msgs });
    }
  }
  return results;
}
