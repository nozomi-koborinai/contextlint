import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Chk001Options {
  section?: string;
  files?: string;
}

export function chk001(options?: Chk001Options): Rule {
  const fileMatcher = options?.files
    ? picomatch(options.files)
    : undefined;

  return {
    id: "CHK-001",
    description:
      "All checklist items in the specified section must be checked",
    severity: "warning",
    check: (context) => {
      if (fileMatcher && !fileMatcher(context.filePath)) {
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
