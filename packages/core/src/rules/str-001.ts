import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const str001Schema = z.object({
  files: z.array(z.string()),
}).strict();

export type Str001Options = z.infer<typeof str001Schema>;

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
