import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const tbl002Schema = z.object({
  columns: z.array(z.string()).optional(),
  files: z.string().optional(),
}).strict().optional();

export type Tbl002Options = z.infer<typeof tbl002Schema>;

export function tbl002(options?: Tbl002Options): Rule {
  const isMatch = options?.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "TBL-002",
    description: "Table cells must not be empty",
    severity: "warning",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const table of context.document.tables) {
        const targetColumns =
          options?.columns?.filter((c) => table.headers.includes(c)) ??
          table.headers;

        for (const row of table.rows) {
          for (const col of targetColumns) {
            if (!row[col] || row[col].trim() === "") {
              context.report({
                severity: "warning",
                message: `Empty cell in column "${col}"`,
                line: table.line,
              });
            }
          }
        }
      }
    },
  };
}
