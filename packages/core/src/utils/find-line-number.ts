/**
 * Return the 1-based line number for a character offset into a string.
 * Counts `\n` characters up to `index`. Robust against `\r\n` line endings
 * since it ignores `\r`.
 */
export function findLineNumber(content: string, index: number): number {
  let line = 1;
  const upto = Math.min(index, content.length);
  for (let i = 0; i < upto; i++) {
    if (content[i] === "\n") {
      line++;
    }
  }
  return line;
}
