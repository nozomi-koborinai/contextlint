import type { Rule } from "../rule.js";

export interface Tbl003Options {
  column: string;
  values: string[];
}

export function tbl003(options: Tbl003Options): Rule {
  return {
    id: "TBL-003",
    description: "Cell values must be from an allowed list",
    severity: "error",
    check: (context) => {
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
