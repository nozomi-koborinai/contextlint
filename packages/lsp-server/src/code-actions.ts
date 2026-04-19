import { CodeActionKind } from "vscode-languageserver/node.js";
import type {
  CodeAction,
  CodeActionParams,
  Diagnostic,
  TextEdit,
} from "vscode-languageserver/node.js";
import type { TextDocument } from "vscode-languageserver-textdocument";

const TBL_002_PLACEHOLDER = "TODO";

/**
 * Build CodeActions for the diagnostics in this request. One translator
 * per supported rule ID; unsupported rules produce no actions.
 */
export function provideCodeActions(
  params: CodeActionParams,
  document: TextDocument,
): CodeAction[] {
  const actions: CodeAction[] = [];
  for (const diagnostic of params.context.diagnostics) {
    const ruleId = diagnosticCode(diagnostic);
    if (ruleId === "CHK-001") {
      const action = fixChk001(diagnostic, document);
      if (action) actions.push(action);
    } else if (ruleId === "TBL-002") {
      const action = fixTbl002(diagnostic, document);
      if (action) actions.push(action);
    }
  }
  return actions;
}

function diagnosticCode(d: Diagnostic): string {
  if (typeof d.code === "string") return d.code;
  if (typeof d.code === "number") return String(d.code);
  return "";
}

function getLineText(document: TextDocument, line: number): string {
  const text = document.getText({
    start: { line, character: 0 },
    end: { line: line + 1, character: 0 },
  });
  return text.replace(/\r?\n$/, "");
}

function fixChk001(
  diagnostic: Diagnostic,
  document: TextDocument,
): CodeAction | null {
  const line = diagnostic.range.start.line;
  const lineText = getLineText(document, line);
  const match = /^(\s*[-*+]\s+)\[ \]/.exec(lineText);
  if (!match) return null;
  const prefix = match[1];
  if (prefix === undefined) return null;
  const spaceInsideBracket = prefix.length + 1;

  const edit: TextEdit = {
    range: {
      start: { line, character: spaceInsideBracket },
      end: { line, character: spaceInsideBracket + 1 },
    },
    newText: "x",
  };
  return {
    title: "Mark checklist item as done",
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [edit],
      },
    },
  };
}

function fixTbl002(
  diagnostic: Diagnostic,
  document: TextDocument,
): CodeAction | null {
  const line = diagnostic.range.start.line;
  const lineText = getLineText(document, line);

  const pipePositions: number[] = [];
  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === "|") pipePositions.push(i);
  }
  if (pipePositions.length < 2) return null;

  const edits: TextEdit[] = [];
  for (let i = 0; i < pipePositions.length - 1; i++) {
    const leftPipe = pipePositions[i];
    const rightPipe = pipePositions[i + 1];
    if (leftPipe === undefined || rightPipe === undefined) continue;
    const cellStart = leftPipe + 1;
    const cellEnd = rightPipe;
    const cell = lineText.slice(cellStart, cellEnd);
    if (cell.trim() === "") {
      edits.push({
        range: {
          start: { line, character: cellStart },
          end: { line, character: cellEnd },
        },
        newText: ` ${TBL_002_PLACEHOLDER} `,
      });
    }
  }

  if (edits.length === 0) return null;

  return {
    title: `Fill empty cells with "${TBL_002_PLACEHOLDER}"`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: edits,
      },
    },
  };
}
