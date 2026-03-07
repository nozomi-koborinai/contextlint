import type { Rule } from "./rule.js";
import { tbl001 } from "./rules/tbl-001.js";
import { tbl002 } from "./rules/tbl-002.js";
import { tbl003 } from "./rules/tbl-003.js";
import { tbl004 } from "./rules/tbl-004.js";
import { str001 } from "./rules/str-001.js";
import { sec001 } from "./rules/sec-001.js";
import { tbl006 } from "./rules/tbl-006.js";
import { ref002 } from "./rules/ref-002.js";
import { ref003 } from "./rules/ref-003.js";
import { ref001 } from "./rules/ref-001.js";
import { tbl005 } from "./rules/tbl-005.js";
import { ref004 } from "./rules/ref-004.js";
import { ref005 } from "./rules/ref-005.js";
import { sec002 } from "./rules/sec-002.js";

type RuleFactory = (options?: Record<string, unknown>) => Rule;

const registry: Record<string, RuleFactory> = {
  tbl001: (options) =>
    tbl001(options as { requiredColumns: string[]; section?: string; files?: string }),
  tbl002: (options) =>
    tbl002(options as { columns?: string[]; files?: string } | undefined),
  tbl003: (options) =>
    tbl003(options as { column: string; values: string[]; files?: string }),
  tbl004: (options) =>
    tbl004(options as { column: string; pattern: string; files?: string }),
  str001: (options) =>
    str001(options as { files: string[] }),
  sec001: (options) =>
    sec001(options as { sections: string[]; files?: string }),
  tbl005: (options) =>
    tbl005(
      options as {
        when: { column: string; equals?: string; oneOf?: string[]; matches?: string };
        then: {
          column: string;
          notEmpty?: boolean;
          equals?: string;
          oneOf?: string[];
          matches?: string;
        };
        section?: string;
        files?: string;
      },
    ),
  tbl006: (options) =>
    tbl006(options as { files: string; column: string; idPattern?: string }),
  ref002: (options) =>
    ref002(
      options as {
        definitions: string;
        references: string[];
        idColumn: string;
        idPattern: string;
      },
    ),
  ref001: (options) =>
    ref001(options as { exclude?: string[] } | undefined),
  ref004: (options) =>
    ref004(
      options as {
        zonesDir: string;
        dependencySection?: string;
      },
    ),
  ref003: (options) =>
    ref003(
      options as {
        stabilityColumn: string;
        stabilityOrder: string[];
        definitions: string;
        references: string[];
        idColumn?: string;
        idPattern?: string;
      },
    ),
  ref005: (options) =>
    ref005(options as { files?: string } | undefined),
  sec002: (options) =>
    sec002(
      options as {
        order: string[];
        level?: number;
        section?: string;
        files?: string;
      },
    ),
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
