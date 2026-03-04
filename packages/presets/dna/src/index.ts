import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface PresetConfig {
  rules: Array<{ rule: string; options?: Record<string, unknown> }>;
}

/**
 * Scan docs/zones/ and generate a contextlint config for software-dna-template.
 *
 * Supports both English ("Stability") and Japanese ("安定度") column names.
 */
export function createConfig(cwd: string): PresetConfig {
  const zones = detectZones(cwd);

  const rules: PresetConfig["rules"] = [
    // Stability column: allowed values check (English)
    {
      rule: "tbl003",
      options: { column: "Stability", values: ["draft", "review", "stable"] },
    },
    // 安定度 column: allowed values check (Japanese)
    {
      rule: "tbl003",
      options: { column: "安定度", values: ["draft", "review", "stable"] },
    },
    // Empty cell check for key columns (both languages)
    {
      rule: "tbl002",
      options: { columns: ["ID", "Stability", "安定度"] },
    },
  ];

  if (zones.length > 0) {
    const files = zones.flatMap((zone) => [
      `docs/zones/${zone}/overview.md`,
      `docs/zones/${zone}/requirements.md`,
    ]);
    rules.push({
      rule: "str001",
      options: { files },
    });
  }

  return { rules };
}

function detectZones(cwd: string): string[] {
  const zonesDir = join(cwd, "docs", "zones");
  try {
    const entries = readdirSync(zonesDir);
    return entries
      .filter((entry) => {
        try {
          return statSync(join(zonesDir, entry)).isDirectory();
        } catch {
          return false;
        }
      })
      .sort();
  } catch {
    return [];
  }
}
