import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ContextlintConfig } from "@contextlint/core";
import { lintWorkspace } from "./linter.js";
import { WorkspaceCache } from "./workspace.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "lint-ws-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("lintWorkspace", () => {
  it("returns empty arrays for every file when no rules match", () => {
    writeFileSync(join(root, "a.md"), "# A\n");
    writeFileSync(join(root, "b.md"), "# B\n");
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const config: ContextlintConfig = { rules: [] };
    const result = lintWorkspace(cache, config, root);

    expect(result.size).toBe(2);
    for (const messages of result.values()) {
      expect(messages).toEqual([]);
    }
  });

  it("runs document-scope rules per file", () => {
    writeFileSync(
      join(root, "bad.md"),
      "# Bad\n\n| Name | Age |\n|------|-----|\n| A    | 30  |\n",
    );
    writeFileSync(
      join(root, "good.md"),
      "# Good\n\n| ID | Status |\n|----|--------|\n| 1  | Done   |\n",
    );
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const config: ContextlintConfig = {
      rules: [
        { rule: "tbl001", options: { requiredColumns: ["ID", "Status"] } },
      ],
    };
    const result = lintWorkspace(cache, config, root);

    const badPath = [...result.keys()].find((k) => k.endsWith("/bad.md"));
    const goodPath = [...result.keys()].find((k) => k.endsWith("/good.md"));
    if (!badPath || !goodPath) throw new Error("expected both files cached");

    expect(result.get(badPath)?.length ?? 0).toBeGreaterThan(0);
    expect(result.get(badPath)?.[0]?.ruleId).toBe("TBL-001");
    expect(result.get(goodPath)).toEqual([]);
  });

  it("runs project-scope rules and attaches to file via filePath", () => {
    // REF-002: REQ-02 defined in requirements.md but not referenced anywhere.
    // Phase 4a attached the orphan warning to the defining file.
    writeFileSync(
      join(root, "requirements.md"),
      "# Req\n\n| ID | Desc |\n|----|------|\n| REQ-01 | first |\n| REQ-02 | second |\n",
    );
    writeFileSync(
      join(root, "spec.md"),
      "# Spec\n\nImplements REQ-01.\n",
    );
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const config: ContextlintConfig = {
      rules: [
        {
          rule: "ref002",
          options: {
            definitions: "**/requirements.md",
            references: ["**/spec.md"],
            idColumn: "ID",
            idPattern: "^REQ-\\d{2}$",
          },
        },
      ],
    };
    const result = lintWorkspace(cache, config, root);

    const reqPath = [...result.keys()].find((k) =>
      k.endsWith("/requirements.md"),
    );
    if (!reqPath) throw new Error("expected requirements.md cached");

    const msgs = result.get(reqPath) ?? [];
    expect(msgs).toHaveLength(1);
    expect(msgs[0]?.ruleId).toBe("REF-002");
    expect(msgs[0]?.message).toContain("REQ-02");
  });

  it("reflects in-memory buffer updates (not on-disk content)", () => {
    writeFileSync(
      join(root, "a.md"),
      "| Name | Age |\n|------|-----|\n| A    | 30  |\n",
    );
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const path = [...cache.documents().keys()][0];
    if (!path) throw new Error("expected one cached file");

    const config: ContextlintConfig = {
      rules: [
        { rule: "tbl001", options: { requiredColumns: ["ID"] } },
      ],
    };

    // Initially bad
    let result = lintWorkspace(cache, config, root);
    expect(result.get(path)?.length ?? 0).toBeGreaterThan(0);

    // Simulate editor fix via buffer update
    cache.updateFromBuffer(
      path,
      "| ID | Age |\n|----|-----|\n| 1  | 30  |\n",
    );
    result = lintWorkspace(cache, config, root);
    expect(result.get(path)).toEqual([]);
  });
});
