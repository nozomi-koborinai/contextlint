#!/usr/bin/env node

import { resolve } from "node:path";
import { Command } from "commander";
import { findConfig, loadConfig, lintFiles, formatFileResults, formatFileResultsJson } from "@contextlint/core";
import { startWatch } from "./watch.js";

const program = new Command();

program
  .name("contextlint")
  .description("Rule-based linter for structured Markdown documents")
  .argument("[files...]", "Files or glob patterns to lint")
  .option(
    "--config <path>",
    "Path to config file",
  )
  .option("--format <format>", "Output format: human or json", "human")
  .option("--cwd <path>", "Working directory", process.cwd())
  .option("--watch", "Watch for file changes and re-lint automatically")
  .action(
    (
      files: string[],
      opts: { config?: string; format: string; cwd: string; watch?: true },
    ) => {
      const cwd = resolve(opts.cwd);

      if (opts.format !== "human" && opts.format !== "json") {
        console.error(
          `Error: Invalid format "${opts.format}". Use "human" or "json".`,
        );
        process.exit(2);
      }

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
    },
  );

program.parse();
