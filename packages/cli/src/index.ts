#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { findConfig, loadConfig, lintFiles, formatFileResults } from "@contextlint/core";

const program = new Command();

program
  .name("contextlint")
  .description("Rule-based linter for structured Markdown documents")
  .argument("[files...]", "Files or glob patterns to lint")
  .option(
    "--config <path>",
    "Path to config file",
  )
  .option("--cwd <path>", "Working directory", process.cwd())
  .action(
    (
      files: string[],
      opts: { config?: string; cwd: string },
    ) => {
      const cwd = resolve(opts.cwd);

      let configPath: string;
      if (opts.config) {
        configPath = resolve(cwd, opts.config);
      } else {
        const found = findConfig(cwd);
        if (!found) {
          console.error(
            "Error: No contextlint.config.json found. Create a config file or use --config.",
          );
          process.exit(2);
        }
        configPath = found;
      }

      let config;
      try {
        config = loadConfig(configPath);
      } catch (err) {
        console.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(2);
      }

      const patterns =
        files.length > 0
          ? files
          : config.include ?? ["**/*.md"];

      try {
        const results = lintFiles(patterns, config, cwd);
        const output = formatFileResults(results, cwd);
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
    },
  );

program.parse();
