import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as z from "zod/v4";

const CONFIG_NAME = "contextlint.config.json";

const configSchema = z.object({
  $schema: z.string().optional(),
  include: z.array(z.string()).optional(),
  rules: z.array(
    z.object({
      rule: z.string(),
      options: z.record(z.string(), z.unknown()).optional(),
    }).strict(),
  ),
}).strict();

export type ContextlintConfig = z.infer<typeof configSchema>;

export function findConfig(startDir: string): string | undefined {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = resolve(dir, CONFIG_NAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function loadConfig(configPath: string): ContextlintConfig {
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf-8");
  } catch {
    throw new Error(`Cannot read config file: ${configPath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }

  const result = configSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid config ${configPath}:\n${issues}`);
  }

  return result.data;
}
