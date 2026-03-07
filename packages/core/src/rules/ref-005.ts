import { resolve, dirname } from "node:path";
import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const ref005Schema = z.object({
  files: z.string().optional(),
}).strict().optional();

export type Ref005Options = z.infer<typeof ref005Schema>;

/**
 * Generate GitHub-style anchor slugs from heading texts.
 * Follows the same algorithm as GitHub:
 * - Lowercase
 * - Remove combining diacritical marks
 * - Keep letters, marks, numbers, connector punctuations, spaces, hyphens
 * - Spaces → hyphens
 * - Duplicate headings get suffixed: #foo, #foo-1, #foo-2
 */
function generateAnchors(sections: string[]): Set<string> {
  const anchors = new Set<string>();
  const counts = new Map<string, number>();

  for (const heading of sections) {
    const base = heading
      .toLowerCase()
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
      .replace(/ /g, "-");

    const count = counts.get(base) ?? 0;
    const anchor = count === 0 ? base : `${base}-${String(count)}`;
    anchors.add(anchor);
    counts.set(base, count + 1);
  }

  return anchors;
}

export function ref005(options?: Ref005Options): Rule {
  const isMatch = options?.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "REF-005",
    description:
      "Anchor fragments in Markdown links must point to headings that exist in the target file",
    severity: "error",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const link of context.document.links) {
        const hashIndex = link.url.indexOf("#");
        if (hashIndex === -1) {
          continue;
        }

        const filePart = link.url.slice(0, hashIndex);
        const rawAnchor = link.url.slice(hashIndex + 1);
        if (!rawAnchor) {
          continue;
        }

        let anchor: string;
        try {
          anchor = decodeURIComponent(rawAnchor);
        } catch {
          anchor = rawAnchor;
        }

        let targetDoc;
        if (filePart) {
          // Cross-file anchor: ./file.md#section
          const resolved = resolve(dirname(context.filePath), filePart);
          targetDoc = context.documents.get(resolved);
          if (!targetDoc) {
            // File doesn't exist — that's REF-001's concern
            continue;
          }
        } else {
          // Same-file anchor: #section
          targetDoc = context.document;
        }

        const validAnchors = generateAnchors(targetDoc.sections);
        if (!validAnchors.has(anchor)) {
          context.report({
            severity: "error",
            message: filePart
              ? `Anchor "#${anchor}" does not match any heading in ${filePart}`
              : `Anchor "#${anchor}" does not match any heading in this file`,
            line: link.line,
          });
        }
      }
    },
  };
}
