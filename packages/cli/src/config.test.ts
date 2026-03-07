import { describe, it, expect } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./config.js";

const tmpDir = join(import.meta.dirname, "__tmp_config_test__");

function setup() {
  mkdirSync(tmpDir, { recursive: true });
}

function cleanup() {
  rmSync(tmpDir, { recursive: true, force: true });
}

describe("loadConfig", () => {
  it("loads a valid config", () => {
    setup();
    try {
      const configPath = join(tmpDir, "valid.json");
      writeFileSync(
        configPath,
        JSON.stringify({
          rules: [{ rule: "tbl001", options: { requiredColumns: ["ID"] } }],
        }),
      );

      const config = loadConfig(configPath, "/");
      expect(config.rules).toHaveLength(1);
      expect(config.rules[0].rule).toBe("tbl001");
    } finally {
      cleanup();
    }
  });

  it("throws when rules array is missing", () => {
    setup();
    try {
      const configPath = join(tmpDir, "no-rules.json");
      writeFileSync(configPath, JSON.stringify({ foo: "bar" }));

      expect(() => loadConfig(configPath, "/")).toThrow(
        'Config must have a "rules" array',
      );
    } finally {
      cleanup();
    }
  });

  it("throws when file does not exist", () => {
    expect(() => loadConfig("nonexistent.json", tmpDir)).toThrow(
      "Cannot read config file",
    );
  });
});
