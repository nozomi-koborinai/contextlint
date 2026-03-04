import type { Rule } from "../rule.js";

export interface Tbl002Options {
  columns?: string[];
}

export function tbl002(options?: Tbl002Options): Rule {
  return {
    id: "TBL-002",
    description: "Table cells must not be empty",
    severity: "warning",
    check: (context) => {
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
