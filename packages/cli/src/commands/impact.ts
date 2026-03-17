import { resolve } from "node:path";
import type { Command } from "commander";
import {
  classifyImpact,
  lintFiles,
  topologicalSort,
  formatImpactResult,
  formatImpactResultJson,
} from "@contextlint/core";
import { loadContext, validateFormat } from "./shared.js";

export function registerImpactCommand(program: Command): void {
  program
    .command("impact")
    .description("Analyze which documents are affected by changes to a file")
    .argument("<file>", "File to analyze impact for")
    .option("--config <path>", "Path to config file")
    .option("--format <format>", "Output format: human or json", "human")
    .option("--cwd <path>", "Working directory", process.cwd())
    .action(
      (
        file: string,
        opts: { config?: string; format: string; cwd: string },
      ) => {
        validateFormat(opts.format);

        const ctx = loadContext(opts);
        const absoluteFilePath = resolve(ctx.cwd, file);

        try {
          // Classify impact
          const impact = classifyImpact(ctx.graph, absoluteFilePath);

          // Collect all affected file paths for lint
          const affectedFiles = [
            ...impact.directlyAffected.map((d) => d.file),
            ...impact.transitivelyAffected.map((t) => t.file),
          ];

          // Run lint on affected files only
          const lintResults =
            affectedFiles.length > 0
              ? lintFiles(affectedFiles, ctx.config, ctx.cwd)
              : [];

          // Get reading order for affected files
          const fullOrder = topologicalSort(ctx.graph);
          const affectedSet = new Set(affectedFiles);
          const readingOrder = fullOrder.filter((f) => affectedSet.has(f));

          // Format output
          const output =
            opts.format === "json"
              ? formatImpactResultJson(
                  absoluteFilePath,
                  impact,
                  lintResults,
                  readingOrder,
                  ctx.cwd,
                )
              : formatImpactResult(
                  impact,
                  lintResults,
                  readingOrder,
                  ctx.cwd,
                );

          console.log(output);

          // Exit with code 1 if lint errors found in affected files
          const hasErrors = lintResults.some((r) =>
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
}
