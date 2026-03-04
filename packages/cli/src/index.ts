#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { loadPreset } from "./preset.js";
import { lintFiles } from "./lint.js";
import { formatResults } from "./format.js";

const program = new Command();

program
  .name("contextlint")
  .description("Rule-based linter for structured Markdown documents")
  .argument("[files...]", "Files or glob patterns to lint", ["**/*.md"])
  .option(
    "--config <path>",
    "Path to config file",
  )
  .option("--preset <name>", "Use a built-in preset (e.g. dna)")
  .option("--cwd <path>", "Working directory", process.cwd())
  .action(
    async (
      files: string[],
      opts: { config?: string; preset?: string; cwd: string },
    ) => {
      const cwd = resolve(opts.cwd);

      if (opts.config && opts.preset) {
        console.error("Error: --config and --preset cannot be used together");
        process.exit(2);
      }

      let config;
      try {
        if (opts.preset) {
          config = loadPreset(opts.preset, cwd);
        } else {
          config = loadConfig(opts.config ?? "contextlint.config.json", cwd);
        }
      } catch (err) {
        console.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(2);
      }

      try {
        const results = await lintFiles(files, config, cwd);
        const output = formatResults(results, cwd);
        console.log(output);

        const hasErrors = results.some((r) => r.messages.length > 0);
        process.exit(hasErrors ? 1 : 0);
      } catch (err) {
        console.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(2);
      }
    },
  );

program.parse();
