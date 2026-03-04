import type { Rule } from "../rule.js";

export interface Str001Options {
  files: string[];
}

export function str001(options: Str001Options): Rule {
  return {
    id: "STR-001",
    description: "Required files must exist in the project",
    severity: "error",
    scope: "project",
    check: (context) => {
      if (!context.projectFiles) {
        return;
      }

      for (const file of options.files) {
        if (!context.projectFiles.includes(file)) {
          context.report({
            severity: "error",
            message: `Required file "${file}" not found`,
            line: 0,
          });
        }
      }
    },
  };
}
