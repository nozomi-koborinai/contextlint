import picomatch from "picomatch";
import type { Rule } from "../rule.js";

export interface Sec001Options {
  sections: string[];
  files?: string;
}

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
