import { relative } from "node:path";
import type { FileLintResult } from "./lint.js";

export function formatResults(
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
        `  line ${msg.line}   ${msg.severity}  ${msg.message}  ${msg.ruleId}`,
      );
      totalErrors++;
    }

    lines.push("");
  }

  const fileWord = filesWithErrors.length === 1 ? "file" : "files";
  const errorWord = totalErrors === 1 ? "error" : "errors";
  lines.push(
    `${totalErrors} ${errorWord} in ${filesWithErrors.length} ${fileWord}`,
  );

  return lines.join("\n");
}
