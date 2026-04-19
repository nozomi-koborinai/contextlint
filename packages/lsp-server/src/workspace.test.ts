import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorkspaceCache } from "./workspace.js";

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ws-cache-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("WorkspaceCache", () => {
  it("scan() populates the cache from files matching the patterns", () => {
    writeFileSync(join(root, "a.md"), "# A\n");
    writeFileSync(join(root, "b.md"), "# B\n");
    writeFileSync(join(root, "ignore.txt"), "not md");

    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    expect(cache.size()).toBe(2);
    const keys = [...cache.documents().keys()].map(normalizePath).sort();
    expect(keys[0]?.endsWith("/a.md")).toBe(true);
    expect(keys[1]?.endsWith("/b.md")).toBe(true);
  });

  it("scan() respects subdirectories and glob exclusions", () => {
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "spec.md"), "# Spec\n");
    writeFileSync(join(root, "README.md"), "# README\n");

    const cache = new WorkspaceCache();
    cache.scan(root, ["docs/**/*.md"]);

    expect(cache.size()).toBe(1);
    const keys = [...cache.documents().keys()].map(normalizePath);
    expect(keys[0]?.endsWith("/docs/spec.md")).toBe(true);
  });

  it("updateFromBuffer() replaces the parsed document in memory", () => {
    writeFileSync(join(root, "a.md"), "# A\n");
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const path = [...cache.documents().keys()][0];
    if (!path) throw new Error("expected one cached file");

    const before = cache.documents().get(path);
    expect(before?.content).toContain("# A");

    cache.updateFromBuffer(path, "# Updated\n\n- new content\n");
    const after = cache.documents().get(path);
    expect(after?.content).toContain("# Updated");
    expect(after?.content).toContain("new content");
  });

  it("updateFromBuffer() adds entries for unseen paths", () => {
    const cache = new WorkspaceCache();
    cache.updateFromBuffer("/tmp/never/scanned.md", "# Hello\n");
    expect(cache.has("/tmp/never/scanned.md")).toBe(true);
  });

  it("delete() removes an entry from the cache", () => {
    writeFileSync(join(root, "a.md"), "# A\n");
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);

    const path = [...cache.documents().keys()][0];
    if (!path) throw new Error("expected one cached file");

    cache.delete(path);
    expect(cache.has(path)).toBe(false);
    expect(cache.size()).toBe(0);
  });

  it("scan() clears prior entries before re-scanning", () => {
    writeFileSync(join(root, "a.md"), "# A\n");
    const cache = new WorkspaceCache();
    cache.scan(root, ["**/*.md"]);
    expect(cache.size()).toBe(1);

    rmSync(join(root, "a.md"));
    writeFileSync(join(root, "b.md"), "# B\n");
    writeFileSync(join(root, "c.md"), "# C\n");
    cache.scan(root, ["**/*.md"]);

    expect(cache.size()).toBe(2);
    expect(cache.has(join(root, "a.md").replace(/\\/g, "/"))).toBe(false);
  });
});
