import { relative } from "node:path";
import type { LintMessage } from "./rule.js";
import type { FileLintResult } from "./lint-files.js";

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
