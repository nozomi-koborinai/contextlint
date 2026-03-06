import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Tbl001Options {
  requiredColumns: string[];
  files?: string;
}

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
