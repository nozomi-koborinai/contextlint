import { relative } from "node:path";
import type { LintMessage, FileLintResult } from "@contextlint/core";

export type { FileLintResult };

export function formatContentResults(messages: LintMessage[]): string {
  if (messages.length === 0) {
    return "No issues found.";
  }

  const lines: string[] = [];

  for (const msg of messages) {
    lines.push(
      `  line ${String(msg.line)}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
    );
  }

  lines.push("");
  const errorWord = messages.length === 1 ? "error" : "errors";
  lines.push(`${String(messages.length)} ${errorWord}`);

  return lines.join("\n");
}

export function formatFileResults(
  results: FileLintResult[],
  cwd: string,
): string {
  const filesWithErrors = results.filter((r) => r.messages.length > 0);

  if (filesWithErrors.length === 0) {
    return "No issues found.";
  }

  const lines: string[] = [];
  let totalErrors = 0;

  for (const result of filesWithErrors) {
    const label =
      result.filePath === "<project>"
        ? "(project)"
        : relative(cwd, result.filePath);
    lines.push(label);

    for (const msg of result.messages) {
      lines.push(
        `  line ${String(msg.line)}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
      );
      totalErrors++;
    }

    lines.push("");
  }

  const fileWord = filesWithErrors.length === 1 ? "file" : "files";
  const errorWord = totalErrors === 1 ? "error" : "errors";
  lines.push(
    `${String(totalErrors)} ${errorWord} in ${String(filesWithErrors.length)} ${fileWord}`,
  );

  return lines.join("\n");
}
