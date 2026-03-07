import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const sec001Schema = z.object({
  sections: z.array(z.string()),
  files: z.string().optional(),
}).strict();

export type Sec001Options = z.infer<typeof sec001Schema>;

export function sec001(options: Sec001Options): Rule {
  const isMatch = options.files
    ? picomatch(`**/${options.files}`)
    : null;

  return {
    id: "SEC-001",
    description: "Required sections must exist in the document",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const section of options.sections) {
        if (!context.document.sections.includes(section)) {
          context.report({
            severity: "error",
            message: `Missing required section "${section}"`,
            line: 0,
          });
        }
      }
    },
  };
}
