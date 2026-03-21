import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { select, checkbox, input, confirm } from "@inquirer/prompts";
import type { Command } from "commander";
import type { Locale, Messages } from "../i18n/index.js";
import { getMessages, localeChoices } from "../i18n/index.js";

const CONFIG_FILE = "contextlint.config.json";

type CategoryKey = keyof Messages["categories"];

/** Rules that work without any required options (zero-config). */
const zeroConfigRules: Record<CategoryKey, readonly string[]> = {
  tbl: ["tbl002"],
  sec: [],
  str: [],
  ref: ["ref001", "ref005", "ref006"],
  chk: ["chk001"],
  ctx: ["ctx001"],
  grp: ["grp002", "grp003"],
};

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatRuleId(rule: string): string {
  return rule.toUpperCase().replace(/(\d{3})/, "-$1");
}

async function runInit(cwd: string): Promise<void> {
  // 1. Select language (always in English)
  const locale: Locale = await select({
    message: "Select language:",
    choices: [...localeChoices],
  });

  const m = getMessages(locale);
  console.log(`\n${m.init.welcome}\n`);

  // 2. Check for existing config
  const configPath = resolve(cwd, CONFIG_FILE);
  if (existsSync(configPath)) {
    const overwrite = await confirm({
      message: m.init.existingConfig,
      default: false,
    });
    if (!overwrite) {
      console.log(m.init.cancelled);
      return;
    }
  }

  // 3. Include patterns
  const includeRaw = await input({
    message: m.init.selectInclude,
  });
  const include =
    includeRaw.trim().length > 0 ? splitCsv(includeRaw) : undefined;

  // 4. Select categories
  const categories = await checkbox<CategoryKey>({
    message: m.init.selectCategories,
    choices: (Object.keys(zeroConfigRules) as CategoryKey[]).map((key) => ({
      name: `${key.toUpperCase()} - ${m.categories[key]}`,
      value: key,
    })),
    required: true,
  });

  // 5. Collect zero-config rules from selected categories
  const rules: Array<{ rule: string }> = [];
  for (const cat of categories) {
    for (const rule of zeroConfigRules[cat]) {
      rules.push({ rule });
    }
  }

  // 6. Write config
  const config = {
    $schema: "https://raw.githubusercontent.com/nozomi-koborinai/contextlint/main/schema.json",
    ...(include ? { include } : {}),
    rules,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

  // 7. Summary
  console.log(`\n✔ ${m.init.created}\n`);

  if (rules.length > 0) {
    console.log(`  ${m.init.includedRules}`);
    console.log(`  ${rules.map((r) => formatRuleId(r.rule)).join(", ")}\n`);
  }

  console.log(`  ${m.init.configHint}`);
  console.log(`  ${m.init.docsUrl}\n`);
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Interactively generate a contextlint.config.json file")
    .option("--cwd <path>", "Working directory", process.cwd())
    .action((opts: { cwd: string }) => {
      const cwd = resolve(opts.cwd);
      runInit(cwd).catch((err: unknown) => {
        // Handle Ctrl+C gracefully
        if (
          err !== null &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name: string }).name === "ExitPromptError"
        ) {
          console.log("\nCancelled.");
          process.exit(0);
        }
        console.error(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(2);
      });
    });
}
