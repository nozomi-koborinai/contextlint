import { createConfig } from "@contextlint/preset-dna";

const KNOWN_PRESETS = ["dna"] as const;
type PresetName = (typeof KNOWN_PRESETS)[number];

export interface PresetConfig {
  rules: Array<{ rule: string; options?: Record<string, unknown> }>;
}

export function loadPreset(name: string, cwd: string): PresetConfig {
  if (!isKnownPreset(name)) {
    throw new Error(
      `Unknown preset: "${name}". Available presets: ${KNOWN_PRESETS.join(", ")}`,
    );
  }

  return createConfig(cwd);
}

function isKnownPreset(name: string): name is PresetName {
  return (KNOWN_PRESETS as readonly string[]).includes(name);
}
