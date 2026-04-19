import { describe, it, expect } from "bun:test";
import {
  CodeActionKind,
  DiagnosticSeverity,
} from "vscode-languageserver/node.js";
import type {
  CodeActionParams,
  Diagnostic,
  TextEdit,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { provideCodeActions } from "./code-actions.js";

const URI = "file:///tmp/test.md";

function doc(content: string): TextDocument {
  return TextDocument.create(URI, "markdown", 1, content);
}

function diag(line: number, code: string, message = "violation"): Diagnostic {
  return {
    severity: DiagnosticSeverity.Warning,
    range: {
      start: { line, character: 0 },
      end: { line, character: 100 },
    },
    message,
    source: "contextlint",
    code,
  };
}

function params(diagnostics: Diagnostic[]): CodeActionParams {
  return {
    textDocument: { uri: URI },
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
    context: { diagnostics },
  };
}

function editsFor(action: { edit?: { changes?: Record<string, TextEdit[]> } }): TextEdit[] {
  const edits = action.edit?.changes?.[URI];
  if (!edits) throw new Error("expected workspace edit for URI");
  return edits;
}

describe("provideCodeActions", () => {
  it("returns no actions when there are no diagnostics", () => {
    expect(provideCodeActions(params([]), doc(""))).toEqual([]);
  });

  it("ignores diagnostics from unsupported rules", () => {
    const d = doc("# Heading\n");
    const actions = provideCodeActions(params([diag(0, "TBL-001")]), d);
    expect(actions).toEqual([]);
  });
});

describe("CHK-001 fix", () => {
  it("produces an edit that flips `[ ]` to `[x]`", () => {
    const d = doc("- [ ] item\n");
    const actions = provideCodeActions(params([diag(0, "CHK-001")]), d);
    expect(actions).toHaveLength(1);
    const action = actions[0];
    if (!action) throw new Error("expected one action");
    expect(action.kind).toBe(CodeActionKind.QuickFix);
    expect(action.title).toContain("done");
    const edits = editsFor(action);
    expect(edits).toEqual([
      {
        range: {
          start: { line: 0, character: 3 },
          end: { line: 0, character: 4 },
        },
        newText: "x",
      },
    ]);
  });

  it("handles indented bullets", () => {
    const d = doc("  * [ ] indented\n");
    const actions = provideCodeActions(params([diag(0, "CHK-001")]), d);
    expect(actions).toHaveLength(1);
    const action = actions[0];
    if (!action) throw new Error("expected one action");
    const edits = editsFor(action);
    expect(edits[0]?.range.start.character).toBe(5); // after "  * ["
    expect(edits[0]?.newText).toBe("x");
  });

  it("returns no action when the line is already checked", () => {
    const d = doc("- [x] done\n");
    const actions = provideCodeActions(params([diag(0, "CHK-001")]), d);
    expect(actions).toEqual([]);
  });

  it("returns no action when the line is not a checklist item", () => {
    const d = doc("# Heading\n");
    const actions = provideCodeActions(params([diag(0, "CHK-001")]), d);
    expect(actions).toEqual([]);
  });
});

describe("TBL-002 fix", () => {
  it("inserts TODO into a single empty cell", () => {
    // Line 0: "| ID | Name |"
    // Line 1: "|----|------|"
    // Line 2: "| 1  |      |"  ← empty cell between the last two pipes
    const d = doc("| ID | Name |\n|----|------|\n| 1  |      |\n");
    const actions = provideCodeActions(params([diag(2, "TBL-002")]), d);
    expect(actions).toHaveLength(1);
    const action = actions[0];
    if (!action) throw new Error("expected one action");
    expect(action.kind).toBe(CodeActionKind.QuickFix);
    const edits = editsFor(action);
    expect(edits).toHaveLength(1);
    expect(edits[0]?.newText).toBe(" TODO ");
  });

  it("inserts TODO into multiple empty cells on the same row", () => {
    // "|   |   |" — two empty cells
    const d = doc("| A | B |\n|---|---|\n|   |   |\n");
    const actions = provideCodeActions(params([diag(2, "TBL-002")]), d);
    expect(actions).toHaveLength(1);
    const action = actions[0];
    if (!action) throw new Error("expected one action");
    const edits = editsFor(action);
    expect(edits).toHaveLength(2);
    for (const e of edits) {
      expect(e.newText).toBe(" TODO ");
    }
  });

  it("returns no action when the row has no empty cells", () => {
    const d = doc("| A | B |\n|---|---|\n| 1 | 2 |\n");
    const actions = provideCodeActions(params([diag(2, "TBL-002")]), d);
    expect(actions).toEqual([]);
  });

  it("returns no action on a line without pipes", () => {
    const d = doc("just text\n");
    const actions = provideCodeActions(params([diag(0, "TBL-002")]), d);
    expect(actions).toEqual([]);
  });
});

describe("mixed diagnostics", () => {
  it("produces actions for CHK-001 and TBL-002 on different lines", () => {
    // line 0: checklist; lines 2-4: table with an empty cell on line 4
    const d = doc(
      "- [ ] todo\n\n| A | B |\n|---|---|\n|   | 2 |\n",
    );
    const actions = provideCodeActions(
      params([diag(0, "CHK-001"), diag(4, "TBL-002")]),
      d,
    );
    expect(actions).toHaveLength(2);
    expect(actions[0]?.title).toContain("done");
    expect(actions[1]?.title).toContain("TODO");
  });
});
