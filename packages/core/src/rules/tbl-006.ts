import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { regexString } from "../utils/regex-string.js";

export const tbl006Schema = z.object({
  files: z.string(),
  column: z.string(),
  idPattern: regexString.optional(),
}).strict();

export type Tbl006Options = z.infer<typeof tbl006Schema>;

export function tbl006(options: Tbl006Options): Rule {
  const isMatch = globMatch(`**/${options.files}`);
  const idRegex = options.idPattern ? new RegExp(options.idPattern) : null;

  return {
    id: "TBL-006",
    description: "IDs in a specified column must be unique across all matched files",
    severity: "error",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Collect all IDs across matched files: id -> { filePath, line }
      const seen = new Map<string, { filePath: string; line: number }>();

      for (const [filePath, doc] of context.documents) {
        if (!isMatch(filePath)) {
          continue;
        }

        for (const table of doc.tables) {
          if (!table.headers.includes(options.column)) {
            continue;
          }

          for (const row of table.rows) {
            const value = row.cells[options.column];
            if (!value) {
              continue;
            }
            if (idRegex && !idRegex.test(value)) {
              continue;
            }

            const existing = seen.get(value);
            if (existing) {
              context.report({
                severity: "error",
                message: `ID "${value}" is already defined in ${existing.filePath}:${String(existing.line)}`,
                line: row.line,
                filePath,
              });
            } else {
              seen.set(value, { filePath, line: row.line });
            }
          }
        }
      }
    },
  };
}
