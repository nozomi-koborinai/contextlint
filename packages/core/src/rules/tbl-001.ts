import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const tbl001Schema = z.object({
  requiredColumns: z.array(z.string()),
  section: z.string().optional(),
  files: z.string().optional(),
}).strict();

export type Tbl001Options = z.infer<typeof tbl001Schema>;

export function tbl001(options: Tbl001Options): Rule {
  const isMatch = options.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "TBL-001",
    description: "Required columns must exist in tables",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const table of context.document.tables) {
        if (options.section && !table.section?.includes(options.section)) {
          continue;
        }

        for (const col of options.requiredColumns) {
          if (!table.headers.includes(col)) {
            context.report({
              severity: "error",
              message: `Missing required column "${col}" in table`,
              line: table.line,
            });
          }
        }
      }
    },
  };
}
