import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import type { ParsedHeading } from "../parser.js";

export const ctx001Schema = z.object({
  section: z.string().optional(),
  placeholders: z.array(z.string()).optional(),
  files: z.string().optional(),
}).strict().optional();

export type Ctx001Options = z.infer<typeof ctx001Schema>;

const DEFAULT_PLACEHOLDERS = ["TBD", "TODO", "WIP", "FIXME", "N/A"];

/**
 * Extract the body content of a section (text between a heading and
 * the next heading of the same or higher level, or end of file).
 */
function extractSectionBody(
  content: string,
  heading: ParsedHeading,
  allHeadings: ParsedHeading[],
): string {
  const lines = content.split("\n");
  const startLine = heading.line; // 1-based
  // Find the next heading of same or higher (lower number) level
  let endLine = lines.length; // exclusive, 1-based
  for (const other of allHeadings) {
    if (other.line > heading.line && other.level <= heading.level) {
      endLine = other.line - 1;
      break;
    }
  }
  // Body starts on the line after the heading
  const bodyLines = lines.slice(startLine, endLine);
  return bodyLines.join("\n");
}

function isPlaceholderContent(
  body: string,
  placeholders: string[],
): { isEmpty: boolean; matchedPlaceholder: string | null } {
  const trimmed = body.trim();

  if (trimmed === "") {
    return { isEmpty: true, matchedPlaceholder: null };
  }

  // Check if the entire body (trimmed) is a single dash (standalone placeholder)
  if (trimmed === "-" || trimmed === "\u2014" || trimmed === "\u2013") {
    return { isEmpty: false, matchedPlaceholder: trimmed };
  }

  // Check case-insensitive match against placeholders
  const lower = trimmed.toLowerCase();
  for (const placeholder of placeholders) {
    if (lower === placeholder.toLowerCase()) {
      return { isEmpty: false, matchedPlaceholder: placeholder };
    }
  }

  return { isEmpty: false, matchedPlaceholder: null };
}

export function ctx001(options?: Ctx001Options): Rule {
  const isMatch = options?.files
    ? picomatch(`**/${options.files}`)
    : null;

  const placeholders = options?.placeholders ?? DEFAULT_PLACEHOLDERS;

  return {
    id: "CTX-001",
    description:
      "Required sections must contain meaningful content, not just placeholders",
    severity: "warning",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      const { headings, content } = context.document;

      for (const heading of headings) {
        if (options?.section !== undefined && heading.text !== options.section) {
          continue;
        }

        const body = extractSectionBody(content, heading, headings);
        const result = isPlaceholderContent(body, placeholders);

        if (result.isEmpty) {
          context.report({
            severity: "warning",
            message: `Section "${heading.text}" has no content`,
            line: heading.line,
          });
        } else if (result.matchedPlaceholder !== null) {
          context.report({
            severity: "warning",
            message: `Section "${heading.text}" contains only placeholder "${result.matchedPlaceholder}"`,
            line: heading.line,
          });
        }
      }
    },
  };
}
