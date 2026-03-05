import { resolve, dirname, relative } from "node:path";
import type { Rule } from "../rule.js";

export interface Ref004Options {
  zonesDir: string;
  dependencySection?: string;
}

export function ref004(options: Ref004Options): Rule {
  const depSection = options.dependencySection ?? "Dependencies";

  function getZone(filePath: string): string | null {
    // Find zonesDir in the path and extract the first directory after it
    const normalized = filePath.replace(/\\/g, "/");
    const zonesDirNormalized = options.zonesDir.replace(/\\/g, "/");
    const idx = normalized.indexOf(`/${zonesDirNormalized}/`);
    if (idx === -1) {
      // Try without leading slash (relative paths)
      if (normalized.startsWith(`${zonesDirNormalized}/`)) {
        const rest = normalized.slice(zonesDirNormalized.length + 1);
        const zone = rest.split("/")[0];
        return zone || null;
      }
      return null;
    }
    const rest = normalized.slice(idx + zonesDirNormalized.length + 2);
    const zone = rest.split("/")[0];
    return zone || null;
  }

  return {
    id: "REF-004",
    description:
      "Cross-zone Markdown links must be backed by an explicit dependency declaration in the zone's overview",
    severity: "error",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      const sourceZone = getZone(context.filePath);
      if (!sourceZone) {
        return;
      }

      // Find cross-zone links
      const crossZoneTargets = new Set<string>();
      for (const link of context.document.links) {
        const resolved = resolve(
          dirname(context.filePath),
          link.url.split("#")[0],
        );
        const targetZone = getZone(resolved);
        if (targetZone && targetZone !== sourceZone) {
          crossZoneTargets.add(targetZone);
        }
      }

      if (crossZoneTargets.size === 0) {
        return;
      }

      // Find the overview.md for this zone and check Dependencies section
      const declaredDeps = new Set<string>();
      for (const [filePath, doc] of context.documents) {
        const zone = getZone(filePath);
        if (zone !== sourceZone) {
          continue;
        }
        if (!filePath.replace(/\\/g, "/").endsWith("/overview.md")) {
          continue;
        }

        // Check if Dependencies section exists and collect declared zones
        if (doc.sections.includes(depSection)) {
          for (const table of doc.tables) {
            if (table.section !== depSection) {
              continue;
            }
            for (const row of table.rows) {
              for (const value of Object.values(row)) {
                if (value) {
                  declaredDeps.add(value.trim());
                }
              }
            }
          }
        }
      }

      // Report undeclared cross-zone dependencies
      for (const targetZone of crossZoneTargets) {
        if (!declaredDeps.has(targetZone)) {
          context.report({
            severity: "error",
            message: `Cross-zone reference to "${targetZone}" zone, but "${targetZone}" is not listed in the "${depSection}" section of ${sourceZone}/overview.md`,
            line: 0,
          });
        }
      }
    },
  };
}
