#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { lintFiles, formatFileResults, formatFileResultsJson } from "@contextlint/core";
import { startWatch } from "./watch.js";
import { validateFormat, resolveConfig } from "./commands/shared.js";
import { registerImpactCommand } from "./commands/impact.js";
import { registerSliceCommand } from "./commands/slice.js";
import { registerGraphCommand } from "./commands/graph.js";
import { registerCompileCommand } from "./commands/compile.js";
import { registerInitCommand } from "./commands/init.js";

function lintAction(
  files: string[],
  opts: { config?: string; format: string; cwd: string; watch?: true },
): void {
  const cwd = resolve(opts.cwd);
  validateFormat(opts.format);

  const { config } = resolveConfig(cwd, opts.config);

  const patterns =
    files.length > 0
      ? files
      : config.include ?? ["**/*.md"];

  if (opts.watch) {
    startWatch(patterns, config, cwd);
    return;
  }

  try {
    const results = lintFiles(patterns, config, cwd);
    const output =
      opts.format === "json"
        ? formatFileResultsJson(results, cwd)
        : formatFileResults(results, cwd);
    console.log(output);

    const hasErrors = results.some((r) =>
      r.messages.some((m) => m.severity === "error"),
    );
    process.exit(hasErrors ? 1 : 0);
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(2);
  }
}

const program = new Command();

program
  .name("contextlint")
  .description("Rule-based linter for structured Markdown documents");

// Explicit "lint" subcommand (isDefault: backward-compatible bare invocation)
program
  .command("lint", { isDefault: true })
  .description("Lint Markdown files (default command)")
  .argument("[files...]", "Files or glob patterns to lint")
  .option("--config <path>", "Path to config file")
  .option("--format <format>", "Output format: human or json", "human")
  .option("--cwd <path>", "Working directory", process.cwd())
  .option("--watch", "Watch for file changes and re-lint automatically")
  .action(lintAction);

// Register subcommands
registerImpactCommand(program);
registerSliceCommand(program);
registerGraphCommand(program);
registerCompileCommand(program);
registerInitCommand(program);

program.parse();
