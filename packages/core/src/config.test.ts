import { describe, it, expect } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { findConfig, loadConfig } from "./config.js";
import { lintFiles } from "./lint-files.js";
import { resolveRule } from "./registry.js";

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
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(
        configPath,
        JSON.stringify({
          rules: [{ rule: "tbl001", options: { requiredColumns: ["ID"] } }],
        }),
      );

      const config = loadConfig(configPath);
      expect(config.rules).toHaveLength(1);
      expect(config.rules[0].rule).toBe("tbl001");
    } finally {
      cleanup();
    }
  });

  it("loads config with include field", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(
        configPath,
        JSON.stringify({
          include: ["docs/**/*.md"],
          rules: [{ rule: "tbl001", options: { requiredColumns: ["ID"] } }],
        }),
      );

      const config = loadConfig(configPath);
      expect(config.include).toEqual(["docs/**/*.md"]);
      expect(config.rules).toHaveLength(1);
    } finally {
      cleanup();
    }
  });

  it("throws when rules array is missing", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(configPath, JSON.stringify({ foo: "bar" }));

      expect(() => loadConfig(configPath)).toThrow("Invalid config");
    } finally {
      cleanup();
    }
  });

  it("throws when rules entry is not an object", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(configPath, JSON.stringify({ rules: ["tbl001"] }));

      expect(() => loadConfig(configPath)).toThrow("Invalid config");
    } finally {
      cleanup();
    }
  });

  it("throws when rule name is missing", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(
        configPath,
        JSON.stringify({ rules: [{ options: {} }] }),
      );

      expect(() => loadConfig(configPath)).toThrow("Invalid config");
    } finally {
      cleanup();
    }
  });

  it("throws when file does not exist", () => {
    expect(() => loadConfig(join(tmpDir, "nonexistent.json"))).toThrow(
      "Cannot read config file",
    );
  });

  it("throws when JSON is invalid", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(configPath, "{ invalid json }");

      expect(() => loadConfig(configPath)).toThrow("Invalid JSON");
    } finally {
      cleanup();
    }
  });
});

describe("resolveRule validation", () => {
  it("throws for missing required options", () => {
    expect(() => resolveRule("tbl001")).toThrow(
      'Invalid options for rule "tbl001"',
    );
  });

  it("throws for wrong option type", () => {
    expect(() =>
      resolveRule("tbl001", { requiredColumns: "ID" }),
    ).toThrow('Invalid options for rule "tbl001"');
  });

  it("throws for invalid regex pattern", () => {
    expect(() =>
      resolveRule("tbl004", { column: "ID", pattern: "[" }),
    ).toThrow('Invalid options for rule "tbl004"');
  });

  it("passes with valid options", () => {
    const rule = resolveRule("tbl001", { requiredColumns: ["ID"] });
    expect(rule.id).toBe("TBL-001");
  });
});

describe("findConfig", () => {
  it("finds config in the start directory", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(configPath, JSON.stringify({ rules: [] }));

      expect(findConfig(tmpDir)).toBe(configPath);
    } finally {
      cleanup();
    }
  });

  it("finds config in a parent directory", () => {
    setup();
    try {
      const configPath = join(tmpDir, "contextlint.config.json");
      writeFileSync(configPath, JSON.stringify({ rules: [] }));
      const nested = join(tmpDir, "sub", "deep");
      mkdirSync(nested, { recursive: true });

      expect(findConfig(nested)).toBe(configPath);
    } finally {
      cleanup();
    }
  });

  it("returns undefined when no config is found", () => {
    expect(findConfig("/")).toBeUndefined();
  });
});

describe("config + lintFiles integration", () => {
  const integrationDir = join(import.meta.dirname, "__tmp_config_integration__");

  function setupIntegration() {
    mkdirSync(join(integrationDir, "docs"), { recursive: true });
    mkdirSync(join(integrationDir, "src"), { recursive: true });
    writeFileSync(
      join(integrationDir, "docs", "spec.md"),
      "# Spec\n\n| ID | Status |\n|----|--------|\n| 1  |        |\n",
    );
    writeFileSync(
      join(integrationDir, "src", "notes.md"),
      "# Notes\n\n| ID | Status |\n|----|--------|\n| 2  |        |\n",
    );
  }

  function cleanupIntegration() {
    rmSync(integrationDir, { recursive: true, force: true });
  }

  it("uses include patterns from config", () => {
    setupIntegration();
    try {
      writeFileSync(
        join(integrationDir, "contextlint.config.json"),
        JSON.stringify({
          include: ["docs/**/*.md"],
          rules: [{ rule: "tbl002" }],
        }),
      );

      const configPath = findConfig(integrationDir);
      expect(configPath).toBeDefined();
      if (!configPath) throw new Error("unreachable");

      const config = loadConfig(configPath);
      const patterns = config.include ?? ["**/*.md"];
      const results = lintFiles(patterns, config, integrationDir);

      // Only docs/spec.md should be linted (not src/notes.md)
      const relFiles = results.map((r) => relative(integrationDir, r.filePath));
      expect(relFiles.some((f) => f.startsWith("docs"))).toBe(true);
      expect(relFiles.some((f) => f.startsWith("src"))).toBe(false);
    } finally {
      cleanupIntegration();
    }
  });

  it("falls back to **/*.md when include is not set", () => {
    setupIntegration();
    try {
      writeFileSync(
        join(integrationDir, "contextlint.config.json"),
        JSON.stringify({
          rules: [{ rule: "tbl002" }],
        }),
      );

      const config = loadConfig(join(integrationDir, "contextlint.config.json"));
      const patterns = config.include ?? ["**/*.md"];
      const results = lintFiles(patterns, config, integrationDir);

      // Both docs/spec.md and src/notes.md should be linted
      const relFiles = results.map((r) => relative(integrationDir, r.filePath));
      expect(relFiles.some((f) => f.startsWith("docs"))).toBe(true);
      expect(relFiles.some((f) => f.startsWith("src"))).toBe(true);
    } finally {
      cleanupIntegration();
    }
  });

  it("explicit patterns override include", () => {
    setupIntegration();
    try {
      writeFileSync(
        join(integrationDir, "contextlint.config.json"),
        JSON.stringify({
          include: ["docs/**/*.md"],
          rules: [{ rule: "tbl002" }],
        }),
      );

      const config = loadConfig(join(integrationDir, "contextlint.config.json"));
      const cliArgs = ["src/**/*.md"];
      const patterns = cliArgs.length > 0 ? cliArgs : config.include ?? ["**/*.md"];
      const results = lintFiles(patterns, config, integrationDir);

      // Only src/notes.md should be linted (CLI args override include)
      const relFiles = results.map((r) => relative(integrationDir, r.filePath));
      expect(relFiles.some((f) => f.startsWith("src"))).toBe(true);
      expect(relFiles.some((f) => f.startsWith("docs"))).toBe(false);
    } finally {
      cleanupIntegration();
    }
  });

  it("auto-detects config from subdirectory", () => {
    setupIntegration();
    try {
      writeFileSync(
        join(integrationDir, "contextlint.config.json"),
        JSON.stringify({
          include: ["**/*.md"],
          rules: [{ rule: "tbl002" }],
        }),
      );

      // findConfig from a nested subdirectory
      const configPath = findConfig(join(integrationDir, "docs"));
      expect(configPath).toBe(join(integrationDir, "contextlint.config.json"));
    } finally {
      cleanupIntegration();
    }
  });
});
