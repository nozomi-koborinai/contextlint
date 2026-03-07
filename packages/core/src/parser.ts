import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Definition, Heading, Link, Table, TableRow, Text } from "mdast";
import type { Node } from "unist";

export interface ParsedTable {
  line: number;
  section: string | null;
  headers: string[];
  rows: Record<string, string>[];
}

export interface ParsedLink {
  url: string;
  line: number;
}

export interface ParsedHeading {
  text: string;
  level: number;
  line: number;
}

export interface ParsedDocument {
  tables: ParsedTable[];
  headings: ParsedHeading[];
  sections: string[];
  links: ParsedLink[];
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

  const headings: ParsedHeading[] = [];
  const tables: ParsedTable[] = [];
  const links: ParsedLink[] = [];

  visit(tree, "heading", (node: Heading) => {
    headings.push({
      text: extractText(node),
      level: node.depth,
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

  // Collect relative links (inline and reference-style), including anchor-only links
  // Skip absolute URLs and non-file URI schemes (mailto:, tel:, data:, etc.)
  const isRelativeLink = (url: string) =>
    !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url);

  visit(tree, "link", (node: Link) => {
    if (isRelativeLink(node.url)) {
      links.push({ url: node.url, line: node.position?.start.line ?? 0 });
    }
  });

  visit(tree, "definition", (node: Definition) => {
    if (isRelativeLink(node.url)) {
      links.push({ url: node.url, line: node.position?.start.line ?? 0 });
    }
  });

  return {
    tables,
    headings,
    sections: headings.map((h) => h.text),
    links,
    content,
  };
}
