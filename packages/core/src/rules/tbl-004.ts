import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { regexString } from "../utils/regex-string.js";

export const tbl004Schema = z.object({
  column: z.string(),
  pattern: regexString,
  files: z.string().optional(),
}).strict();

export type Tbl004Options = z.infer<typeof tbl004Schema>;

export function tbl004(options: Tbl004Options): Rule {
  const regex = new RegExp(options.pattern);
  const isMatch = options.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "TBL-004",
    description: "Cell values must match the specified pattern",
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
          if (value && !regex.test(value)) {
            context.report({
              severity: "error",
              message: `Value "${value}" in column "${options.column}" does not match pattern "${options.pattern}"`,
              line: table.line,
            });
          }
        }
      }
    },
  };
}
