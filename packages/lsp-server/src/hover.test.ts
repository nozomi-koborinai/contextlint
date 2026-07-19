import { describe, it, expect } from "bun:test";
import {
  DiagnosticSeverity,
  MarkupKind,
} from "vscode-languageserver/node";
import type { Diagnostic, HoverParams } from "vscode-languageserver/node";
import { hoverForDiagnostics } from "./hover.js";

function diag(
  overrides: Partial<Diagnostic> & Pick<Diagnostic, "range">,
): Diagnostic {
  return {
    severity: DiagnosticSeverity.Warning,
    message: "default",
    source: "contextlint",
    ...overrides,
  };
}

function params(line: number, character: number): HoverParams {
  return {
    textDocument: { uri: "file:///tmp/test.md" },
    position: { line, character },
  };
}

describe("hoverForDiagnostics", () => {
  it("returns hover content when the cursor is inside a diagnostic range", () => {
    const diagnostics: Diagnostic[] = [
      diag({
        range: {
          start: { line: 2, character: 0 },
          end: { line: 2, character: 80 },
        },
        code: "TBL-002",
        message: "Empty cell in column \"Status\"",
      }),
    ];
    const hover = hoverForDiagnostics(params(2, 10), diagnostics);
    expect(hover).not.toBeNull();
    const contents = hover?.contents;
    if (!contents || typeof contents !== "object" || Array.isArray(contents)) {
      throw new Error("expected MarkupContent");
    }
    expect(contents.kind).toBe(MarkupKind.Markdown);
    expect(contents.value).toContain("**TBL-002**");
    expect(contents.value).toContain("Empty cell in column \"Status\"");
  });

  it("returns null when the cursor is outside every diagnostic", () => {
    const diagnostics: Diagnostic[] = [
      diag({
        range: {
          start: { line: 5, character: 0 },
          end: { line: 5, character: 10 },
        },
        code: "TBL-001",
        message: "x",
      }),
    ];
    expect(hoverForDiagnostics(params(10, 0), diagnostics)).toBeNull();
  });

  it("returns null when there are no diagnostics", () => {
    expect(hoverForDiagnostics(params(0, 0), [])).toBeNull();
  });

  it("picks the first matching diagnostic when multiple overlap", () => {
    const range = {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 10 },
    };
    const diagnostics: Diagnostic[] = [
      diag({ range, code: "FIRST", message: "first" }),
      diag({ range, code: "SECOND", message: "second" }),
    ];
    const hover = hoverForDiagnostics(params(0, 2), diagnostics);
    const contents = hover?.contents;
    if (!contents || typeof contents !== "object" || Array.isArray(contents)) {
      throw new Error("expected MarkupContent");
    }
    expect(contents.value).toContain("**FIRST**");
    expect(contents.value).not.toContain("**SECOND**");
  });

  it("falls back to **contextlint** when the diagnostic has no code", () => {
    const diagnostics: Diagnostic[] = [
      diag({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 10 },
        },
        message: "generic",
      }),
    ];
    const hover = hoverForDiagnostics(params(0, 1), diagnostics);
    const contents = hover?.contents;
    if (!contents || typeof contents !== "object" || Array.isArray(contents)) {
      throw new Error("expected MarkupContent");
    }
    expect(contents.value).toContain("**contextlint**");
  });

  it("stringifies numeric diagnostic codes", () => {
    const diagnostics: Diagnostic[] = [
      diag({
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 5 },
        },
        code: 42,
        message: "numeric",
      }),
    ];
    const hover = hoverForDiagnostics(params(0, 1), diagnostics);
    const contents = hover?.contents;
    if (!contents || typeof contents !== "object" || Array.isArray(contents)) {
      throw new Error("expected MarkupContent");
    }
    expect(contents.value).toContain("**42**");
  });
});
