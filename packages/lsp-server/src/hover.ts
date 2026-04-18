import { MarkupKind } from "vscode-languageserver/node.js";
import type {
  Diagnostic,
  Hover,
  HoverParams,
  Position,
  Range,
} from "vscode-languageserver/node.js";

/**
 * Return hover content for the diagnostic under the cursor.
 * When multiple diagnostics overlap, the first match wins.
 */
export function hoverForDiagnostics(
  params: HoverParams,
  diagnostics: readonly Diagnostic[],
): Hover | null {
  const hit = diagnostics.find((d) => isInRange(params.position, d.range));
  if (!hit) return null;

  const ruleId = diagnosticCode(hit);
  const title = ruleId ? `**${ruleId}**` : "**contextlint**";
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: `${title}\n\n${hit.message}`,
    },
    range: hit.range,
  };
}

function diagnosticCode(d: Diagnostic): string {
  if (typeof d.code === "string") return d.code;
  if (typeof d.code === "number") return String(d.code);
  return "";
}

function isInRange(pos: Position, range: Range): boolean {
  if (pos.line < range.start.line || pos.line > range.end.line) return false;
  if (pos.line === range.start.line && pos.character < range.start.character) {
    return false;
  }
  if (pos.line === range.end.line && pos.character > range.end.character) {
    return false;
  }
  return true;
}
