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

  const rawFiles = globSync(patterns, { cwd, absolute: true, nodir: true });
  const files = rawFiles.map((f) => f.replace(/\\/g, "/"));
  files.sort();

  const projectFiles = files.map((f) => relative(cwd, f).replace(/\\/g, "/"));

  const documents = new Map<string, ParsedDocument>();
  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    documents.set(filePath, parseDocument(content));
  }

  const results: FileLintResult[] = [];

  if (projectRules.length > 0) {
    const emptyDoc = parseDocument("");
    const messages = runRules(projectRules, emptyDoc, "<project>", {
      projectFiles,
      documents,
    });
    if (messages.length > 0) {
      results.push({ filePath: "<project>", messages });
    }
  }

  for (const filePath of files) {
    const document = documents.get(filePath);
    if (!document) continue;
    const messages = runRules(docRules, document, filePath, { documents });
    results.push({ filePath, messages });
  }

  return results;
}
