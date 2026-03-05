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

  it("returns tbl003 (EN + JA), tbl002, and tbl004 rules even without zones", () => {
    const config = createConfig(tmp);
    expect(config.rules).toHaveLength(4);
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
    expect(config.rules[3]).toEqual({
      rule: "tbl004",
      options: { column: "ID", pattern: "^[A-Z]+-[A-Z]+-\\d{2}$" },
    });
  });

  it("detects zones and adds str001 rule", () => {
    mkdirSync(join(tmp, "docs", "zones", "core"), { recursive: true });
    mkdirSync(join(tmp, "docs", "zones", "infra"), { recursive: true });

    const config = createConfig(tmp);
    expect(config.rules).toHaveLength(6);

    const str001 = config.rules[4];
    expect(str001.rule).toBe("str001");
    expect(str001.options).toEqual({
      files: [
        "docs/zones/core/overview.md",
        "docs/zones/core/requirements.md",
        "docs/zones/infra/overview.md",
        "docs/zones/infra/requirements.md",
      ],
    });

    const ref004 = config.rules[5];
    expect(ref004.rule).toBe("ref004");
    expect(ref004.options).toEqual({ zonesDir: "docs/zones" });
  });

  it("ignores files in zones directory (only directories)", () => {
    mkdirSync(join(tmp, "docs", "zones", "valid-zone"), { recursive: true });
    writeFileSync(join(tmp, "docs", "zones", "README.md"), "# Zones");

    const config = createConfig(tmp);
    const str001 = config.rules[4];
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
    const str001 = config.rules[4];
    const files = (str001.options as { files: string[] }).files;
    expect(files[0]).toContain("alpha");
    expect(files[2]).toContain("zebra");
  });
});
