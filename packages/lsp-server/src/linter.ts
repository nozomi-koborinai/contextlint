import { relative } from "node:path";
import {
  parseDocument,
  resolveRule,
  runRules,
} from "@contextlint/core";
import type {
  ContextlintConfig,
  LintMessage,
  Rule,
} from "@contextlint/core";
import type { WorkspaceCache } from "./workspace.js";

/**
 * Run the full lint pipeline (document-scope + project-scope rules)
 * against every document in the workspace cache. Returns a per-file
 * map of messages keyed by absolute file path. Files without any
 * messages still have an empty-array entry so callers can publish
 * diagnostics that clear stale violations.
 *
 * Project-scope messages without an explicit `filePath` go to the
 * virtual `<project>` bucket.
 */
export function lintWorkspace(
  cache: WorkspaceCache,
  config: ContextlintConfig,
  cwd: string,
): Map<string, LintMessage[]> {
  const rules: Rule[] = config.rules.map((entry) =>
    resolveRule(entry.rule, entry.options),
  );
  const docRules = rules.filter((r) => (r.scope ?? "document") === "document");
  const projectRules = rules.filter((r) => r.scope === "project");

  const documents = cache.documents();
  const projectFiles = [...documents.keys()].map((f) =>
    relative(cwd, f).replace(/\\/g, "/"),
  );

  const perFile = new Map<string, LintMessage[]>();
  for (const filePath of documents.keys()) {
    perFile.set(filePath, []);
  }

  const pushMsg = (key: string, msg: LintMessage): void => {
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
      pushMsg(msg.filePath ?? "<project>", msg);
    }
  }

  for (const [filePath, doc] of documents) {
    const messages = runRules(docRules, doc, filePath, { documents });
    for (const msg of messages) {
      pushMsg(filePath, msg);
    }
  }

  return perFile;
}
