import { describe, it, expect } from "bun:test";
import { DiagnosticSeverity } from "vscode-languageserver/node.js";
import type { LintMessage } from "@contextlint/core";
import { toDiagnostic, toDiagnostics } from "./diagnostics.js";

describe("toDiagnostic", () => {
  it("maps a warning LintMessage to an LSP Diagnostic", () => {
    const msg: LintMessage = {
      ruleId: "TBL-002",
      severity: "warning",
      message: "Empty cell in column \"Status\"",
      line: 3,
    };
    const d = toDiagnostic(msg);
    expect(d.severity).toBe(DiagnosticSeverity.Warning);
    expect(d.message).toBe("Empty cell in column \"Status\"");
    expect(d.source).toBe("contextlint");
    expect(d.code).toBe("TBL-002");
  });

  it("maps an error LintMessage to DiagnosticSeverity.Error", () => {
    const msg: LintMessage = {
      ruleId: "REF-001",
      severity: "error",
      message: "Link target \"./api.md\" does not exist",
      line: 12,
    };
    const d = toDiagnostic(msg);
    expect(d.severity).toBe(DiagnosticSeverity.Error);
  });

  it("converts 1-based line to 0-based for LSP range", () => {
    const msg: LintMessage = {
      ruleId: "TBL-001",
      severity: "error",
      message: "missing column",
      line: 5,
    };
    const d = toDiagnostic(msg);
    expect(d.range.start.line).toBe(4);
    expect(d.range.end.line).toBe(4);
    expect(d.range.start.character).toBe(0);
    expect(d.range.end.character).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("clamps line=0 to 0 (never negative)", () => {
    const msg: LintMessage = {
      ruleId: "X-000",
      severity: "warning",
      message: "edge",
      line: 0,
    };
    const d = toDiagnostic(msg);
    expect(d.range.start.line).toBe(0);
  });
});

describe("toDiagnostics", () => {
  it("maps a list of messages in order", () => {
    const messages: LintMessage[] = [
      { ruleId: "TBL-001", severity: "error", message: "a", line: 1 },
      { ruleId: "TBL-002", severity: "warning", message: "b", line: 2 },
    ];
    const result = toDiagnostics(messages);
    expect(result).toHaveLength(2);
    expect(result[0]?.code).toBe("TBL-001");
    expect(result[1]?.code).toBe("TBL-002");
  });

  it("returns an empty array for empty input", () => {
    expect(toDiagnostics([])).toEqual([]);
  });
});
