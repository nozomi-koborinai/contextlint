import picomatch from "picomatch";
import type { Rule } from "../rule.js";
import type { ParsedHeading } from "../parser.js";

export interface Sec002Options {
  order: string[];
  level?: number;
  section?: string;
  files?: string;
}

interface HeadingGroup {
  parent: string | null;
  headings: ParsedHeading[];
}

function groupByParent(
  headings: ParsedHeading[],
  level: number,
): HeadingGroup[] {
  const groups: HeadingGroup[] = [];
  let current: HeadingGroup = { parent: null, headings: [] };

  for (const heading of headings) {
    if (heading.level < level) {
      if (current.parent !== null || current.headings.length > 0) {
        groups.push(current);
      }
      current = { parent: heading.text, headings: [] };
    } else if (heading.level === level) {
      current.headings.push(heading);
    }
  }

  if (current.parent !== null || current.headings.length > 0) {
    groups.push(current);
  }

  return groups;
}

function checkOrder(
  headings: ParsedHeading[],
  order: string[],
  report: (line: number, text: string, after: string) => void,
): void {
  const matched = headings.filter((h) => order.includes(h.text));

  let maxIndex = -1;
  let maxText = "";
  for (const heading of matched) {
    const index = order.indexOf(heading.text);
    if (index < maxIndex) {
      report(heading.line, heading.text, maxText);
    } else {
      maxIndex = index;
      maxText = heading.text;
    }
  }
}

export function sec002(options: Sec002Options): Rule {
  const fileMatcher = options.files ? picomatch(options.files) : undefined;

  return {
    id: "SEC-002",
    description: "Sections must appear in the specified order",
    severity: "error",
    check: (context) => {
      if (fileMatcher && !fileMatcher(context.filePath)) {
        return;
      }

      const report = (line: number, text: string, after: string) => {
        context.report({
          severity: "error",
          message: `Section "${text}" must appear before "${after}"`,
          line,
        });
      };

      if (options.level !== undefined) {
        const groups = groupByParent(context.document.headings, options.level);

        if (options.section !== undefined) {
          const group = groups.find((g) => g.parent === options.section);
          if (group) {
            checkOrder(group.headings, options.order, report);
          }
        } else {
          for (const group of groups) {
            checkOrder(group.headings, options.order, report);
          }
        }
      } else {
        checkOrder(context.document.headings, options.order, report);
      }
    },
  };
}
