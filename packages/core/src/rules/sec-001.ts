import type { Rule } from "../rule.js";

export interface Sec001Options {
  sections: string[];
}

export function sec001(options: Sec001Options): Rule {
  return {
    id: "SEC-001",
    description: "Required sections must exist in the document",
    severity: "error",
    check: (context) => {
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
