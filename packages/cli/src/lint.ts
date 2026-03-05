import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { glob } from "glob";
import { parseDocument, runRules, resolveRule } from "@contextlint/core";
import type { LintMessage, ParsedDocument } from "@contextlint/core";
import type { ContextlintConfig } from "./config.js";

export interface FileLintResult {
  filePath: string;
  messages: LintMessage[];
}

export async function lintFiles(
  patterns: string[],
  config: ContextlintConfig,
  cwd: string,
): Promise<FileLintResult[]> {
  const rules = config.rules.map((entry) =>
    resolveRule(entry.rule, entry.options),
  );

  const docRules = rules.filter((r) => (r.scope ?? "document") === "document");
  const projectRules = rules.filter((r) => r.scope === "project");

  const files = await glob(patterns, { cwd, absolute: true });
  files.sort();

  const projectFiles = files.map((f) => relative(cwd, f));

  // Parse all files upfront (shared by document and project rules)
  const documents = new Map<string, ParsedDocument>();
  for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    documents.set(filePath, parseDocument(content));
  }

  const results: FileLintResult[] = [];

  // Run project-scoped rules once
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

  // Run document-scoped rules per file
  for (const filePath of files) {
    const document = documents.get(filePath)!;
    const messages = runRules(docRules, document, filePath);
    results.push({ filePath, messages });
  }

  return results;
}
