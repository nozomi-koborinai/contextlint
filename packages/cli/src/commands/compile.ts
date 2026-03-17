import { resolve, dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Command } from "commander";
import {
  compileContext,
} from "@contextlint/core";
import { resolveConfig } from "./shared.js";

export function registerCompileCommand(program: Command): void {
  program
    .command("compile")
    .description("Compile documents and rules into a SKILL.md file")
    .option("--config <path>", "Path to config file")
    .option("--outdir <path>", "Output directory for generated files")
    .option("--dry-run", "Preview what would be generated without writing files")
    .option("--cwd <path>", "Working directory", process.cwd())
    .action(
      (opts: {
        config?: string;
        outdir?: string;
        dryRun?: true;
        cwd: string;
      }) => {
        const cwd = resolve(opts.cwd);
        const { config } = resolveConfig(cwd, opts.config);

        if (!config.compile) {
          console.error(
            "Error: No 'compile' section found in config. Add a 'compile' section to contextlint.config.json.",
          );
          process.exit(2);
        }

        const patterns = config.include ?? ["**/*.md"];

        try {
          const result = compileContext(patterns, config, cwd);

          const outdir = resolve(
            cwd,
            opts.outdir ?? config.compile.outdir ?? ".claude/skills/contextlint",
          );
          const skillPath = resolve(outdir, "SKILL.md");
          const { documentCount, ruleCount, componentCount } = result.metadata;
          const clusterWord = componentCount === 1 ? "cluster" : "clusters";
          const docWord = documentCount === 1 ? "document" : "documents";
          const ruleWord = ruleCount === 1 ? "rule" : "rules";

          if (opts.dryRun) {
            const lines: string[] = [];
            lines.push("Would generate:");
            lines.push(`  ${resolve(outdir, "SKILL.md")}`);
            lines.push("");
            lines.push(
              `Source: ${String(documentCount)} ${docWord}, ${String(ruleCount)} ${ruleWord}, ${String(componentCount)} ${clusterWord}`,
            );
            console.log(lines.join("\n"));
            return;
          }

          // Write the file
          mkdirSync(dirname(skillPath), { recursive: true });
          writeFileSync(skillPath, result.skillContent, "utf-8");

          const lines: string[] = [];
          lines.push("Generated:");
          lines.push(`  ${skillPath}`);
          lines.push("");
          lines.push(
            `Source: ${String(documentCount)} ${docWord}, ${String(ruleCount)} ${ruleWord}, ${String(componentCount)} ${clusterWord}`,
          );
          console.log(lines.join("\n"));
          process.exit(0);
        } catch (err) {
          console.error(
            `Error: ${err instanceof Error ? err.message : String(err)}`,
          );
          process.exit(2);
        }
      },
    );
}
