import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Tbl004Options {
  column: string;
  pattern: string;
  files?: string;
}

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
