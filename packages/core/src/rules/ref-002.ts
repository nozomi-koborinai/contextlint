import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { regexString } from "../utils/regex-string.js";

export const ref002Schema = z.object({
  definitions: z.string(),
  references: z.array(z.string()),
  idColumn: z.string(),
  idPattern: regexString,
}).strict();

export type Ref002Options = z.infer<typeof ref002Schema>;

export function ref002(options: Ref002Options): Rule {
  const isDefinition = globMatch(`**/${options.definitions}`);
  const isReference = options.references.map((p) => globMatch(`**/${p}`));
  const idRegex = new RegExp(options.idPattern);

  function matchesReference(filePath: string): boolean {
    return isReference.some((matcher) => matcher(filePath));
  }

  return {
    id: "REF-002",
    description:
      "Validate that requirement IDs defined in definition files are referenced, and that IDs referenced elsewhere exist in definition files",
    severity: "error",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Collect defined IDs: id -> { filePath, line }
      const defined = new Map<string, { filePath: string; line: number }>();
      for (const [filePath, doc] of context.documents) {
        if (!isDefinition(filePath)) {
          continue;
        }
        for (const table of doc.tables) {
          if (!table.headers.includes(options.idColumn)) {
            continue;
          }
          for (const row of table.rows) {
            const value = row.cells[options.idColumn];
            if (value && idRegex.test(value)) {
              defined.set(value, { filePath, line: row.line });
            }
          }
        }
      }

      // Collect referenced IDs with location info: id -> [{ filePath, line }]
      const referenced = new Map<
        string,
        Array<{ filePath: string; line: number }>
      >();
      const addReference = (id: string, filePath: string, line: number) => {
        const arr = referenced.get(id) ?? [];
        arr.push({ filePath, line });
        referenced.set(id, arr);
      };

      for (const [filePath, doc] of context.documents) {
        if (!matchesReference(filePath)) {
          continue;
        }

        // Line-by-line scan of the full content covers both prose tokens
        // and table cells (table cells are part of the content string).
        // Scanning once avoids double-counting a single reference.
        const lines = doc.content.split(/\r?\n/);
        const seenOnLine = new Set<string>();
        for (let i = 0; i < lines.length; i++) {
          seenOnLine.clear();
          const lineText = lines[i] ?? "";
          const tokens = lineText.match(/\S+/g) ?? [];
          for (const token of tokens) {
            const cleaned = token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");
            if (cleaned && idRegex.test(cleaned) && !seenOnLine.has(cleaned)) {
              seenOnLine.add(cleaned);
              addReference(cleaned, filePath, i + 1);
            }
          }
        }
      }

      // Report dangling references at each referencing location
      for (const [id, locations] of referenced) {
        if (defined.has(id)) continue;
        for (const location of locations) {
          context.report({
            severity: "error",
            message: `ID "${id}" is referenced but not defined in any definition file`,
            line: location.line,
            filePath: location.filePath,
          });
        }
      }

      // Report orphan definitions at the definition row
      for (const [id, location] of defined) {
        if (!referenced.has(id)) {
          context.report({
            severity: "warning",
            message: `ID "${id}" is defined but never referenced`,
            line: location.line,
            filePath: location.filePath,
          });
        }
      }
    },
  };
}
