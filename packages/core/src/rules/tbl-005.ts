import picomatch from "picomatch";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import { regexString } from "../utils/regex-string.js";

const tbl005ConditionSchema = z.object({
  column: z.string(),
  equals: z.string().optional(),
  oneOf: z.array(z.string()).optional(),
  matches: regexString.optional(),
}).strict();

const tbl005ConstraintSchema = z.object({
  column: z.string(),
  notEmpty: z.boolean().optional(),
  equals: z.string().optional(),
  oneOf: z.array(z.string()).optional(),
  matches: regexString.optional(),
}).strict();

export const tbl005Schema = z.object({
  when: tbl005ConditionSchema,
  then: tbl005ConstraintSchema,
  section: z.string().optional(),
  files: z.string().optional(),
}).strict();

export type Tbl005Condition = z.infer<typeof tbl005ConditionSchema>;
export type Tbl005Constraint = z.infer<typeof tbl005ConstraintSchema>;
export type Tbl005Options = z.infer<typeof tbl005Schema>;

function matchesCondition(value: string, condition: Tbl005Condition): boolean {
  if (condition.equals !== undefined) {
    return value === condition.equals;
  }
  if (condition.oneOf !== undefined) {
    return condition.oneOf.includes(value);
  }
  if (condition.matches !== undefined) {
    return new RegExp(condition.matches).test(value);
  }
  return false;
}

function violatesConstraint(value: string | undefined, constraint: Tbl005Constraint): boolean {
  if (constraint.notEmpty) {
    return !value || value.trim() === "";
  }
  if (constraint.equals !== undefined) {
    return value !== constraint.equals;
  }
  if (constraint.oneOf !== undefined) {
    return !value || !constraint.oneOf.includes(value);
  }
  if (constraint.matches !== undefined) {
    return !value || !new RegExp(constraint.matches).test(value);
  }
  return false;
}

export function tbl005(options: Tbl005Options): Rule {
  const isMatch = options.files ? picomatch(`**/${options.files}`) : null;

  return {
    id: "TBL-005",
    description:
      "When a condition on one column is met, another column must satisfy a specified constraint",
    severity: "error",
    check: (context) => {
      if (isMatch && !isMatch(context.filePath)) {
        return;
      }

      for (const table of context.document.tables) {
        if (options.section && !table.section?.includes(options.section)) {
          continue;
        }

        if (!table.headers.includes(options.when.column)) {
          continue;
        }

        if (!table.headers.includes(options.then.column)) {
          continue;
        }

        for (const row of table.rows) {
          const conditionValue = row[options.when.column];
          if (!conditionValue) {
            continue;
          }

          if (!matchesCondition(conditionValue, options.when)) {
            continue;
          }

          const constraintValue = row[options.then.column];
          if (violatesConstraint(constraintValue, options.then)) {
            const conditionDesc = describeCondition(options.when);
            const constraintDesc = describeConstraint(options.then);
            context.report({
              severity: "error",
              message: `Row where ${conditionDesc}: column "${options.then.column}" ${constraintDesc}`,
              line: table.line,
            });
          }
        }
      }
    },
  };
}

function describeCondition(condition: Tbl005Condition): string {
  if (condition.equals !== undefined) {
    return `${condition.column}="${condition.equals}"`;
  }
  if (condition.oneOf !== undefined) {
    return `${condition.column} is one of [${condition.oneOf.join(", ")}]`;
  }
  if (condition.matches !== undefined) {
    return `${condition.column} matches /${condition.matches}/`;
  }
  return condition.column;
}

function describeConstraint(constraint: Tbl005Constraint): string {
  if (constraint.notEmpty) {
    return "must not be empty";
  }
  if (constraint.equals !== undefined) {
    return `must equal "${constraint.equals}"`;
  }
  if (constraint.oneOf !== undefined) {
    return `must be one of [${constraint.oneOf.join(", ")}]`;
  }
  if (constraint.matches !== undefined) {
    return `must match /${constraint.matches}/`;
  }
  return "violates constraint";
}
