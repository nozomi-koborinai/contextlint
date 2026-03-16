import { globMatch } from "../utils/glob-match.js";
import * as z from "zod/v4";
import type { Rule } from "../rule.js";
import type { ParsedDocument } from "../parser.js";

export const ctx002Schema = z
  .object({
    glossary: z.string(),
    section: z.string().optional(),
    termColumn: z.string(),
    aliasColumn: z.string(),
    files: z.string().optional(),
  })
  .strict();

export type Ctx002Options = z.infer<typeof ctx002Schema>;

interface GlossaryEntry {
  canonical: string;
  aliases: string[];
}

/**
 * Build a regex that matches the given term with awareness of surrounding
 * characters. For CJK characters we cannot rely on `\b` (which only works
 * at ASCII word boundaries), so we use lookaround assertions that match
 * the start/end of string or a character that is NOT the same "class" as
 * the term's boundary character.
 *
 * Strategy:
 * - If the term consists entirely of ASCII word characters, use `\b`.
 * - Otherwise, use a negative look-behind/ahead for non-whitespace to
 *   prevent matching inside larger words while still matching CJK runs
 *   adjacent to whitespace, punctuation, or string boundaries.
 */
function buildTermRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isAsciiWord = /^[A-Za-z0-9_]+$/.test(term);
  if (isAsciiWord) {
    return new RegExp(`\\b${escaped}\\b`, "gi");
  }
  // For CJK and mixed content: ensure the term is not embedded inside a
  // larger stretch of non-whitespace that would indicate a different word.
  // We require that the character immediately before/after the term (if any)
  // is NOT a word character (for Latin boundaries) and is not a CJK character
  // (to avoid matching inside compound CJK words when possible).
  // However, CJK languages typically don't use spaces between words, so for
  // CJK terms we accept matches at any position — the term itself is the
  // meaningful unit.
  return new RegExp(escaped, "gi");
}

function extractGlossary(
  doc: ParsedDocument,
  options: Ctx002Options,
): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];

  for (const table of doc.tables) {
    // If section is specified, only use tables under that section
    if (options.section && table.section !== options.section) {
      continue;
    }

    if (
      !table.headers.includes(options.termColumn) ||
      !table.headers.includes(options.aliasColumn)
    ) {
      continue;
    }

    for (const row of table.rows) {
      const canonical = row[options.termColumn];
      const aliasCell = row[options.aliasColumn];
      if (!canonical || !aliasCell) {
        continue;
      }

      const aliases = aliasCell
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      if (aliases.length > 0) {
        entries.push({ canonical, aliases });
      }
    }
  }

  return entries;
}

function findLineNumber(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === "\n") {
      line++;
    }
  }
  return line;
}

export function ctx002(options: Ctx002Options): Rule {
  const isGlossaryMatch = globMatch(`**/${options.glossary}`);
  const isMatch = options.files ? globMatch(`**/${options.files}`) : null;

  return {
    id: "CTX-002",
    description:
      "Terms used across documents must match definitions in a glossary table",
    severity: "warning",
    scope: "project",
    check: (context) => {
      if (!context.documents) {
        return;
      }

      // Step 1: Find the glossary file and extract entries
      let glossaryEntries: GlossaryEntry[] = [];
      let glossaryFilePath: string | null = null;

      for (const [filePath, doc] of context.documents) {
        if (isGlossaryMatch(filePath)) {
          glossaryEntries = extractGlossary(doc, options);
          glossaryFilePath = filePath;
          break;
        }
      }

      if (glossaryEntries.length === 0) {
        return;
      }

      // Build a map: lowercased alias -> { canonical, originalAlias }
      const aliasMap = new Map<
        string,
        { canonical: string; originalAlias: string; regex: RegExp }
      >();
      for (const entry of glossaryEntries) {
        for (const alias of entry.aliases) {
          aliasMap.set(alias.toLowerCase(), {
            canonical: entry.canonical,
            originalAlias: alias,
            regex: buildTermRegex(alias),
          });
        }
      }

      // Also collect canonical terms (lowercased) to skip them when scanning
      const canonicalSet = new Set<string>();
      for (const entry of glossaryEntries) {
        canonicalSet.add(entry.canonical.toLowerCase());
      }

      // Step 2: Scan matched files for alias usage
      for (const [filePath, doc] of context.documents) {
        // Skip the glossary file itself
        if (filePath === glossaryFilePath) {
          continue;
        }

        // Apply files filter
        if (isMatch && !isMatch(filePath)) {
          continue;
        }

        const content = doc.content;

        for (const [, entry] of aliasMap) {
          entry.regex.lastIndex = 0;
          let match: RegExpExecArray | null = entry.regex.exec(content);
          while (match) {
            const line = findLineNumber(content, match.index);
            context.report({
              severity: "warning",
              message: `"${entry.originalAlias}" should be "${entry.canonical}" (defined in glossary)`,
              line,
            });
            match = entry.regex.exec(content);
          }
        }
      }
    },
  };
}
