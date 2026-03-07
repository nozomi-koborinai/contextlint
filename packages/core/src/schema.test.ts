import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ruleNames } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SchemaRuleEntry {
  properties: {
    rule: { const: string };
  };
}

interface Schema {
  properties: {
    rules: {
      items: {
        oneOf: SchemaRuleEntry[];
      };
    };
  };
}

describe("schema.json", () => {
  const schemaPath = resolve(__dirname, "../../../schema.json");
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8")) as Schema;
  const schemaRules = schema.properties.rules.items.oneOf.map(
    (entry) => entry.properties.rule.const,
  );

  it("contains an entry for every registered rule", () => {
    for (const name of ruleNames) {
      expect(schemaRules, `schema.json is missing rule "${name}"`).toContain(
        name,
      );
    }
  });

  it("does not contain rules that are not registered", () => {
    for (const name of schemaRules) {
      expect(
        ruleNames,
        `schema.json has rule "${name}" but it is not in the registry`,
      ).toContain(name);
    }
  });
});
