import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createConfig } from "./index.js";

describe("createConfig", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = join(tmpdir(), `preset-dna-test-${Date.now()}`);
    mkdirSync(tmp, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("returns tbl003 (EN + JA) and tbl002 rules even without zones", () => {
    const config = createConfig(tmp);
    expect(config.rules).toHaveLength(3);
    expect(config.rules[0]).toEqual({
      rule: "tbl003",
      options: { column: "Stability", values: ["draft", "review", "stable"] },
    });
    expect(config.rules[1]).toEqual({
      rule: "tbl003",
      options: { column: "安定度", values: ["draft", "review", "stable"] },
    });
    expect(config.rules[2]).toEqual({
      rule: "tbl002",
      options: { columns: ["ID", "Stability", "安定度"] },
    });
  });

  it("detects zones and adds str001 rule", () => {
    mkdirSync(join(tmp, "docs", "zones", "core"), { recursive: true });
    mkdirSync(join(tmp, "docs", "zones", "infra"), { recursive: true });

    const config = createConfig(tmp);
    expect(config.rules).toHaveLength(4);

    const str001 = config.rules[3];
    expect(str001.rule).toBe("str001");
    expect(str001.options).toEqual({
      files: [
        "docs/zones/core/overview.md",
        "docs/zones/core/requirements.md",
        "docs/zones/infra/overview.md",
        "docs/zones/infra/requirements.md",
      ],
    });
  });

  it("ignores files in zones directory (only directories)", () => {
    mkdirSync(join(tmp, "docs", "zones", "valid-zone"), { recursive: true });
    writeFileSync(join(tmp, "docs", "zones", "README.md"), "# Zones");

    const config = createConfig(tmp);
    const str001 = config.rules[3];
    expect(str001.options).toEqual({
      files: [
        "docs/zones/valid-zone/overview.md",
        "docs/zones/valid-zone/requirements.md",
      ],
    });
  });

  it("sorts zones alphabetically", () => {
    mkdirSync(join(tmp, "docs", "zones", "zebra"), { recursive: true });
    mkdirSync(join(tmp, "docs", "zones", "alpha"), { recursive: true });

    const config = createConfig(tmp);
    const str001 = config.rules[3];
    const files = (str001.options as { files: string[] }).files;
    expect(files[0]).toContain("alpha");
    expect(files[2]).toContain("zebra");
  });
});
