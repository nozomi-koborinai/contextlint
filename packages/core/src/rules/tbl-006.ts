import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Tbl006Options {
  files: string;
  column: string;
  idPattern?: string;
}

export function tbl006(options: Tbl006Options): Rule {
  const isMatch = picomatch(`**/${options.files}`);
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
            const value = row[options.column];
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
                message: `ID "${value}" is already defined in ${existing.filePath}:${existing.line}`,
                line: table.line,
              });
            } else {
              seen.set(value, { filePath, line: table.line });
            }
          }
        }
      }
    },
  };
}
