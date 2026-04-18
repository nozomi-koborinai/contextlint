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
import type { TextDocument } from "vscode-languageserver-textdocument";
import { uriToPath } from "./uri.js";

/**
 * Lint a single in-memory document using document-scope rules from the config.
 * Project-scope and cross-file rules are skipped — they need the full workspace,
 * which the LSP server does not currently re-read on every buffer change.
 */
export function lintBuffer(
  document: TextDocument,
  config: ContextlintConfig,
): LintMessage[] {
  const rules: Rule[] = config.rules
    .map((entry) => resolveRule(entry.rule, entry.options))
    .filter((rule) => (rule.scope ?? "document") === "document");

  if (rules.length === 0) return [];

  const parsed = parseDocument(document.getText());
  const filePath = uriToPath(document.uri);
  return runRules(rules, parsed, filePath);
}
