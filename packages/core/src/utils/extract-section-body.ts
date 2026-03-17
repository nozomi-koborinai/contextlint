import type { ParsedHeading } from "../parser.js";

/**
 * Extract the body content of a section identified by heading text.
 *
 * Returns the text between the target heading and the next heading of
 * the same or higher level (lower number), or the end of the file.
 * Returns `null` if the target heading is not found.
 */
export function extractSectionBody(
  content: string,
  headings: ParsedHeading[],
  targetHeading: string,
): string | null {
  const heading = headings.find((h) => h.text === targetHeading);
  if (!heading) return null;

  const lines = content.split("\n");
  const startLine = heading.line; // 1-based

  // Find the next heading of same or higher (lower number) level
  let endLine = lines.length; // exclusive, 1-based
  for (const other of headings) {
    if (other.line > heading.line && other.level <= heading.level) {
      endLine = other.line - 1;
      break;
    }
  }

  // Body starts on the line after the heading
  const bodyLines = lines.slice(startLine, endLine);
  return bodyLines.join("\n");
}
