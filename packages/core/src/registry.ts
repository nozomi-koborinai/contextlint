import type { Rule } from "./rule.js";
import { tbl001 } from "./rules/tbl-001.js";
import { tbl002 } from "./rules/tbl-002.js";
import { tbl003 } from "./rules/tbl-003.js";
import { tbl004 } from "./rules/tbl-004.js";
import { str001 } from "./rules/str-001.js";
import { sec001 } from "./rules/sec-001.js";

type RuleFactory = (options?: Record<string, unknown>) => Rule;

const registry: Record<string, RuleFactory> = {
  tbl001: (options) =>
    tbl001(options as { requiredColumns: string[] }),
  tbl002: (options) =>
    tbl002(options as { columns?: string[] } | undefined),
  tbl003: (options) =>
    tbl003(options as { column: string; values: string[] }),
  tbl004: (options) =>
    tbl004(options as { column: string; pattern: string }),
  str001: (options) =>
    str001(options as { files: string[] }),
  sec001: (options) =>
    sec001(options as { sections: string[] }),
};

export function resolveRule(
  name: string,
  options?: Record<string, unknown>,
): Rule {
  const factory = registry[name];
  if (!factory) {
    throw new Error(`Unknown rule: "${name}"`);
  }
  return factory(options);
}
