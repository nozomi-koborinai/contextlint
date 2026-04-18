import { DiagnosticSeverity } from "vscode-languageserver/node.js";
import type { Diagnostic } from "vscode-languageserver/node.js";
import type { LintMessage, Severity } from "@contextlint/core";

export function toDiagnostic(message: LintMessage): Diagnostic {
  const line = Math.max(0, message.line - 1);
  return {
    severity: toLspSeverity(message.severity),
    range: {
      start: { line, character: 0 },
      end: { line, character: Number.MAX_SAFE_INTEGER },
    },
    message: message.message,
    source: "contextlint",
    code: message.ruleId,
  };
}

export function toDiagnostics(messages: LintMessage[]): Diagnostic[] {
  return messages.map(toDiagnostic);
}

function toLspSeverity(severity: Severity): DiagnosticSeverity {
  return severity === "error"
    ? DiagnosticSeverity.Error
    : DiagnosticSeverity.Warning;
}
