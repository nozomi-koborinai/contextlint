import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";

export const chk001Schema = z.object({
  section: z.string().optional(),
  files: z.string().optional(),
}).strict().optional();

export type Chk001Options = z.infer<typeof chk001Schema>;

export function chk001(options?: Chk001Options): Rule {
  const isMatch = options?.files
    ? picomatch(`**/${options.files}`)
    : null;

  return {
    id: "CHK-001",
    description:
      "All checklist items in the specified section must be checked",
    severity: "warning",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const item of context.document.checkItems) {
        if (options?.section !== undefined && item.section !== options.section) {
          continue;
        }

        if (!item.checked) {
          const location = item.section
            ? ` in section "${item.section}"`
            : "";
          context.report({
            severity: "warning",
            message: `Unchecked item "${item.text}"${location}`,
            line: item.line,
          });
        }
      }
    },
  };
}
