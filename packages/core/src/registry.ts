import * as z from "zod/v4";
import type { Rule } from "./rule.js";
import { tbl001, tbl001Schema } from "./rules/tbl-001.js";
import { tbl002, tbl002Schema } from "./rules/tbl-002.js";
import { tbl003, tbl003Schema } from "./rules/tbl-003.js";
import { tbl004, tbl004Schema } from "./rules/tbl-004.js";
import { tbl005, tbl005Schema } from "./rules/tbl-005.js";
import { tbl006, tbl006Schema } from "./rules/tbl-006.js";
import { sec001, sec001Schema } from "./rules/sec-001.js";
import { sec002, sec002Schema } from "./rules/sec-002.js";
import { str001, str001Schema } from "./rules/str-001.js";
import { ref001, ref001Schema } from "./rules/ref-001.js";
import { ref002, ref002Schema } from "./rules/ref-002.js";
import { ref003, ref003Schema } from "./rules/ref-003.js";
import { ref004, ref004Schema } from "./rules/ref-004.js";
import { ref005, ref005Schema } from "./rules/ref-005.js";
import { ref006, ref006Schema } from "./rules/ref-006.js";
import { chk001, chk001Schema } from "./rules/chk-001.js";

function defineRule<T>(
  schema: z.ZodType<T>,
  factory: (options: T) => Rule,
) {
  return {
    schema,
    create: (options: unknown) => factory(schema.parse(options)),
  };
}

const registry = {
  tbl001: defineRule(tbl001Schema, tbl001),
  tbl002: defineRule(tbl002Schema, tbl002),
  tbl003: defineRule(tbl003Schema, tbl003),
  tbl004: defineRule(tbl004Schema, tbl004),
  tbl005: defineRule(tbl005Schema, tbl005),
  tbl006: defineRule(tbl006Schema, tbl006),
  sec001: defineRule(sec001Schema, sec001),
  sec002: defineRule(sec002Schema, sec002),
  str001: defineRule(str001Schema, str001),
  ref001: defineRule(ref001Schema, ref001),
  ref002: defineRule(ref002Schema, ref002),
  ref003: defineRule(ref003Schema, ref003),
  ref004: defineRule(ref004Schema, ref004),
  ref005: defineRule(ref005Schema, ref005),
  ref006: defineRule(ref006Schema, ref006),
  chk001: defineRule(chk001Schema, chk001),
};

export const ruleNames = Object.keys(registry);

export function resolveRule(
  name: string,
  options?: Record<string, unknown>,
): Rule {
  const entry = (registry as Partial<Record<string, (typeof registry)[keyof typeof registry]>>)[name];
  if (!entry) {
    throw new Error(`Unknown rule: "${name}"`);
  }
  try {
    return entry.create(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Invalid options for rule "${name}":\n${issues}`, { cause: error });
    }
    throw error;
  }
}
