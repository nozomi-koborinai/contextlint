import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const tbl003Schema = z.object({
  column: z.string(),
  values: z.array(z.string()),
  files: z.string().optional(),
}).strict();

export type Tbl003Options = z.infer<typeof tbl003Schema>;

export function tbl003(options: Tbl003Options): Rule {
  const isMatch = options.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "TBL-003",
    description: "Cell values must be from an allowed list",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const table of context.document.tables) {
        if (!table.headers.includes(options.column)) {
          continue;
        }

        for (const row of table.rows) {
          const value = row[options.column];
          if (value && !options.values.includes(value)) {
            context.report({
              severity: "error",
              message: `Invalid value "${value}" in column "${options.column}". Allowed: ${options.values.join(", ")}`,
              line: table.line,
            });
          }
        }
      }
    },
  };
}
