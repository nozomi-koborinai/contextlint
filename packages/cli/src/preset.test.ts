import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadPreset } from "./preset.js";

describe("loadPreset", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = join(tmpdir(), `preset-test-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("loads dna preset and returns config with rules", () => {
    mkdirSync(join(tmp, "docs", "zones", "core"), { recursive: true });

    const config = loadPreset("dna", tmp);
    expect(config.rules).toBeDefined();
    expect(config.rules.length).toBeGreaterThanOrEqual(3);

    const ruleNames = config.rules.map((r) => r.rule);
    expect(ruleNames).toContain("tbl003");
    expect(ruleNames).toContain("tbl002");
    expect(ruleNames).toContain("str001");
  });

  it("throws for unknown preset", () => {
    expect(() => loadPreset("unknown", tmp)).toThrow(
      'Unknown preset: "unknown"',
    );
  });
});
