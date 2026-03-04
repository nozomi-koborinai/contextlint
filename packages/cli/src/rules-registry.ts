import type { Rule } from "@contextlint/core";
import { tbl001, tbl002, tbl003, str001 } from "@contextlint/core";

type RuleFactory = (options?: Record<string, unknown>) => Rule;

const registry: Record<string, RuleFactory> = {
  tbl001: (options) =>
    tbl001(options as { requiredColumns: string[] }),
  tbl002: (options) =>
    tbl002(options as { columns?: string[] } | undefined),
  tbl003: (options) =>
    tbl003(options as { column: string; values: string[] }),
  str001: (options) =>
    str001(options as { files: string[] }),
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
