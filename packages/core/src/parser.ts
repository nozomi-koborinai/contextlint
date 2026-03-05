import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Heading, Table, TableRow, Text } from "mdast";
import type { Node } from "unist";

export interface ParsedTable {
  line: number;
  section: string | null;
  headers: string[];
  rows: Record<string, string>[];
}

export interface ParsedDocument {
  tables: ParsedTable[];
  sections: string[];
  content: string;
}

function extractText(node: Node): string {
  if ((node as Text).type === "text") {
    return (node as Text).value;
  }
  if ("children" in node) {
    return (node as { children: Node[] }).children.map(extractText).join("");
  }
  return "";
}

function extractCellText(row: TableRow): string[] {
  return row.children.map((cell) => extractText(cell).trim());
}

export function parseDocument(content: string): ParsedDocument {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content);

  const headings: { text: string; line: number }[] = [];
  const tables: ParsedTable[] = [];

  visit(tree, "heading", (node: Heading) => {
    headings.push({
      text: extractText(node),
      line: node.position?.start.line ?? 0,
    });
  });

  visit(tree, "table", (node: Table) => {
    const tableLine = node.position?.start.line ?? 0;
    const [headerRow, ...dataRows] = node.children;

    if (!headerRow) return;

    const headers = extractCellText(headerRow);

    const rows = dataRows.map((row) => {
      const cells = extractCellText(row);
      const record: Record<string, string> = {};
      headers.forEach((header, i) => {
        record[header] = cells[i] ?? "";
      });
      return record;
    });

    // Find the nearest heading above this table
    let section: string | null = null;
    for (let i = headings.length - 1; i >= 0; i--) {
      if (headings[i].line < tableLine) {
        section = headings[i].text;
        break;
      }
    }

    tables.push({ line: tableLine, section, headers, rows });
  });

  return {
    tables,
    sections: headings.map((h) => h.text),
    content,
  };
}
