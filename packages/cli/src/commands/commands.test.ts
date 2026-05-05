import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Helper to run the CLI as a subprocess.
 * Uses Bun.spawn to invoke the compiled CLI entry point.
 */
function runCli(
  args: string[],
  cwd: string,
): { stdout: string; stderr: string; exitCode: number } {
  const cliPath = resolve(
    import.meta.dir,
    "../../dist/index.js",
  );
  const result = Bun.spawnSync(["node", cliPath, ...args], {
    cwd,
    env: { ...process.env, NO_COLOR: "1" },
  });
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.exitCode,
  };
}

/** Create a minimal test project with config and markdown files */
function createTestProject(dir: string): void {
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "docs"), { recursive: true });

  // doc A references doc B
  writeFileSync(
    join(dir, "docs", "overview.md"),
    `# Overview

See [requirements](requirements.md) for details.
See [design](design.md) for the design.
`,
  );

  writeFileSync(
    join(dir, "docs", "requirements.md"),
    `# Requirements

| ID | Title | Status |
|----|-------|--------|
| REQ-001 | Feature A | Draft |
| REQ-002 | Feature B | Done |

See [design](design.md) for implementation.
`,
  );

  writeFileSync(
    join(dir, "docs", "design.md"),
    `# Design

Implementation details for the project.
`,
  );

  writeFileSync(
    join(dir, "contextlint.config.json"),
    JSON.stringify(
      {
        include: ["docs/**/*.md"],
        rules: [
          {
            rule: "tbl002",
            options: { columns: ["ID", "Title", "Status"] },
          },
        ],
      },
      null,
      2,
    ),
  );
}

/** Create a test project that also has a compile section */
function createTestProjectWithCompile(dir: string): void {
  createTestProject(dir);

  // Overwrite config with compile section
  writeFileSync(
    join(dir, "contextlint.config.json"),
    JSON.stringify(
      {
        include: ["docs/**/*.md"],
        rules: [
          {
            rule: "tbl002",
            options: { columns: ["ID", "Title", "Status"] },
          },
        ],
        compile: {
          outdir: ".claude/skills/test-project",
          skill: {
            name: "Test Project Docs",
            description: "Skill for test project documentation.",
          },
        },
      },
      null,
      2,
    ),
  );
}

let testDir: string;

beforeEach(() => {
  testDir = resolve(tmpdir(), `contextlint-cli-test-${String(Date.now())}-${Math.random().toString(36).slice(2)}`);
});

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// ---------------------------------------------------------------------------
// Backward compatibility: default lint action
// ---------------------------------------------------------------------------

describe("default lint (backward compat)", () => {
  it("runs lint when invoked with no subcommand", () => {
    createTestProject(testDir);
    const result = runCli([], testDir);
    // Should produce lint output (not an error about missing subcommand)
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No issues found.");
  });

  it("runs lint with file arguments", () => {
    createTestProject(testDir);
    const result = runCli(["docs/overview.md"], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No issues found.");
  });
});

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

describe("help text", () => {
  it("shows help for the main command", () => {
    createTestProject(testDir);
    const result = runCli(["--help"], testDir);
    expect(result.stdout).toContain("contextlint");
    expect(result.stdout).toContain("impact");
    expect(result.stdout).toContain("slice");
    expect(result.stdout).toContain("graph");
    expect(result.stdout).toContain("compile");
  });

  it("shows help for impact subcommand", () => {
    createTestProject(testDir);
    const result = runCli(["impact", "--help"], testDir);
    expect(result.stdout).toContain("impact");
    expect(result.stdout).toContain("<file>");
  });

  it("shows help for slice subcommand", () => {
    createTestProject(testDir);
    const result = runCli(["slice", "--help"], testDir);
    expect(result.stdout).toContain("slice");
    expect(result.stdout).toContain("<query>");
    expect(result.stdout).toContain("--depth");
  });

  it("shows help for graph subcommand", () => {
    createTestProject(testDir);
    const result = runCli(["graph", "--help"], testDir);
    expect(result.stdout).toContain("graph");
    expect(result.stdout).toContain("--format");
  });

  it("shows help for compile subcommand", () => {
    createTestProject(testDir);
    const result = runCli(["compile", "--help"], testDir);
    expect(result.stdout).toContain("compile");
    expect(result.stdout).toContain("--outdir");
    expect(result.stdout).toContain("--dry-run");
  });
});

// ---------------------------------------------------------------------------
// impact subcommand
// ---------------------------------------------------------------------------

describe("impact subcommand", () => {
  it("formats impact analysis result in human format", () => {
    createTestProject(testDir);
    const result = runCli(
      ["impact", "docs/requirements.md"],
      testDir,
    );
    expect(result.exitCode).toBe(0);
    // overview.md references requirements.md, so it should be directly affected
    expect(result.stdout).toContain("Directly affected");
    expect(result.stdout).toContain("overview.md");
  });

  it("formats impact analysis result in json format", () => {
    createTestProject(testDir);
    const result = runCli(
      ["impact", "docs/requirements.md", "--format", "json"],
      testDir,
    );
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(parsed).toHaveProperty("changedFile");
    expect(parsed).toHaveProperty("directlyAffected");
    expect(parsed).toHaveProperty("transitivelyAffected");
    expect(parsed).toHaveProperty("readingOrder");
    expect(parsed).toHaveProperty("lint");
  });

  it("shows reading order for affected files", () => {
    createTestProject(testDir);
    const result = runCli(
      ["impact", "docs/design.md"],
      testDir,
    );
    expect(result.exitCode).toBe(0);
    // Both overview.md and requirements.md reference design.md
    expect(result.stdout).toContain("Reading order");
  });
});

// ---------------------------------------------------------------------------
// slice subcommand
// ---------------------------------------------------------------------------

describe("slice subcommand", () => {
  it("extracts relevant files for a query", () => {
    createTestProject(testDir);
    const result = runCli(
      ["slice", "docs/overview.md"],
      testDir,
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Context Slice");
    expect(result.stdout).toContain("relevant");
  });

  it("formats slice result in json format", () => {
    createTestProject(testDir);
    const result = runCli(
      ["slice", "docs/overview.md", "--format", "json"],
      testDir,
    );
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(parsed).toHaveProperty("query");
    expect(parsed).toHaveProperty("files");
  });

  it("respects --depth option", () => {
    createTestProject(testDir);
    const depth0 = runCli(
      ["slice", "docs/overview.md", "--depth", "0"],
      testDir,
    );
    expect(depth0.exitCode).toBe(0);
    // depth 0 should return only the queried file
    expect(depth0.stdout).toContain("1 relevant file");

    const depth2 = runCli(
      ["slice", "docs/overview.md", "--depth", "2"],
      testDir,
    );
    expect(depth2.exitCode).toBe(0);
    // depth 2 should include files reachable from overview
    expect(depth2.stdout).toContain("relevant");
  });
});

// ---------------------------------------------------------------------------
// graph subcommand
// ---------------------------------------------------------------------------

describe("graph subcommand", () => {
  it("shows graph information in human format", () => {
    createTestProject(testDir);
    const result = runCli(["graph"], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Document Graph:");
    expect(result.stdout).toContain("files");
    expect(result.stdout).toContain("edges");
  });

  it("shows graph information in json format", () => {
    createTestProject(testDir);
    const result = runCli(["graph", "--format", "json"], testDir);
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(parsed).toHaveProperty("nodes");
    expect(parsed).toHaveProperty("edges");
    expect(parsed).toHaveProperty("components");
    expect(parsed).toHaveProperty("readingOrder");
  });

  it("includes reading order in output", () => {
    createTestProject(testDir);
    const result = runCli(["graph"], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Reading order");
  });
});

// ---------------------------------------------------------------------------
// compile subcommand
// ---------------------------------------------------------------------------

describe("compile subcommand", () => {
  it("generates SKILL.md file", () => {
    createTestProjectWithCompile(testDir);
    const result = runCli(["compile"], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Generated:");
    expect(result.stdout).toContain("SKILL.md");
    expect(result.stdout).toContain("Source:");

    // Verify file was actually created
    const skillPath = join(testDir, ".claude/skills/test-project/SKILL.md");
    expect(existsSync(skillPath)).toBe(true);

    const content = readFileSync(skillPath, "utf-8");
    expect(content).toContain("Test Project Docs");
    expect(content).toContain("Generated by contextlint compile");
  });

  it("does not write files with --dry-run", () => {
    createTestProjectWithCompile(testDir);
    const result = runCli(["compile", "--dry-run"], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Would generate:");
    expect(result.stdout).toContain("SKILL.md");
    expect(result.stdout).toContain("Source:");

    // Verify file was NOT created
    const skillPath = join(testDir, ".claude/skills/test-project/SKILL.md");
    expect(existsSync(skillPath)).toBe(false);
  });

  it("errors when config has no compile section", () => {
    createTestProject(testDir); // No compile section
    const result = runCli(["compile"], testDir);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain(
      "No 'compile' section found in config",
    );
  });

  it("respects --outdir option", () => {
    createTestProjectWithCompile(testDir);
    const customOutdir = join(testDir, "custom-output");
    const result = runCli(["compile", "--outdir", customOutdir], testDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Generated:");

    const skillPath = join(customOutdir, "SKILL.md");
    expect(existsSync(skillPath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// siteRouter (Starlight) — end-to-end through the CLI
// ---------------------------------------------------------------------------

/**
 * Set up a Starlight-shaped fixture under <dir>/src/content/docs.
 * Pages link to each other via absolute SSG URLs (e.g. /docs/a/) so the
 * resolution path can only succeed when siteRouter is configured.
 */
function createStarlightFixture(
  dir: string,
  rules: unknown[],
): void {
  const contentDir = join(dir, "src", "content", "docs", "docs");
  mkdirSync(join(contentDir, "a"), { recursive: true });
  mkdirSync(join(contentDir, "b"), { recursive: true });
  mkdirSync(join(contentDir, "orphan"), { recursive: true });

  writeFileSync(
    join(contentDir, "a", "index.md"),
    `# A\n\nSee [b](/docs/b/).\n`,
  );
  writeFileSync(
    join(contentDir, "b", "index.md"),
    `# B\n\nSee [a](/docs/a/).\n`,
  );
  writeFileSync(
    join(contentDir, "orphan", "index.md"),
    `# Orphan\n\nNobody links here.\n`,
  );

  writeFileSync(
    join(dir, "contextlint.config.json"),
    JSON.stringify(
      {
        include: ["src/content/docs/**/*.md"],
        rules,
      },
      null,
      2,
    ),
  );
}

describe("siteRouter end-to-end", () => {
  it("GRP-002 detects cycles through Starlight URLs when siteRouter is set", () => {
    createStarlightFixture(testDir, [
      {
        rule: "grp002",
        options: {
          siteRouter: {
            preset: "starlight",
            contentDir: "src/content/docs",
            defaultLocale: "root",
            locales: ["root"],
          },
        },
      },
    ]);
    const result = runCli([], testDir);
    expect(result.stdout).toContain("Circular reference detected");
    expect(result.stdout).toMatch(/a[/\\]index\.md/);
    expect(result.stdout).toMatch(/b[/\\]index\.md/);
  });

  it("GRP-002 does not flag the same cycle without siteRouter (regression)", () => {
    createStarlightFixture(testDir, [{ rule: "grp002" }]);
    const result = runCli([], testDir);
    // Absolute URLs are unresolvable without a router — no cycle should appear.
    expect(result.stdout).not.toContain("Circular reference detected");
  });

  it("GRP-003 reports orphan pages reached only via Starlight URLs", () => {
    createStarlightFixture(testDir, [
      {
        rule: "grp003",
        options: {
          files: "src/content/docs/**/*.md",
          entryPoints: ["docs/a/index.md"],
          siteRouter: {
            preset: "starlight",
            contentDir: "src/content/docs",
            defaultLocale: "root",
            locales: ["root"],
          },
        },
      },
    ]);
    const result = runCli([], testDir);
    // a is the entry point, b has an incoming reference from a, orphan has none.
    expect(result.stdout).toContain("no incoming references");
    expect(result.stdout).toMatch(/orphan[/\\]index\.md/);
    expect(result.stdout).not.toMatch(/[^a-z]a[/\\]index\.md\s+has no incoming/);
    expect(result.stdout).not.toMatch(/b[/\\]index\.md\s+has no incoming/);
  });

  it("REF-001 resolves Starlight URLs through the shared utility", () => {
    // a links to /docs/missing/ (does not exist) and /docs/b/ (exists).
    // The missing one must be reported; the existing one must not.
    const contentDir = join(testDir, "src", "content", "docs", "docs");
    mkdirSync(join(contentDir, "a"), { recursive: true });
    mkdirSync(join(contentDir, "b"), { recursive: true });
    writeFileSync(
      join(contentDir, "a", "index.md"),
      `# A\n\nSee [b](/docs/b/) and [missing](/docs/missing/).\n`,
    );
    writeFileSync(join(contentDir, "b", "index.md"), `# B\n`);

    writeFileSync(
      join(testDir, "contextlint.config.json"),
      JSON.stringify(
        {
          include: ["src/content/docs/**/*.md"],
          rules: [
            {
              rule: "ref001",
              options: {
                siteRouter: {
                  preset: "starlight",
                  contentDir: "src/content/docs",
                  defaultLocale: "root",
                  locales: ["root"],
                },
              },
            },
          ],
        },
        null,
        2,
      ),
    );

    const result = runCli([], testDir);
    expect(result.stdout).toContain("/docs/missing/");
    expect(result.stdout).toContain("does not exist");
    expect(result.stdout).not.toContain("/docs/b/");
  });
});
