import picomatch from "picomatch";

/**
 * Create a picomatch matcher that handles dot-directories (e.g. `.claude/`).
 *
 * By default picomatch's `**` does not match path segments starting with `.`.
 * Since file paths may traverse dot-directories (e.g. in worktrees:
 * `.claude/worktrees/...`), we always enable `{ dot: true }`.
 */
export function globMatch(pattern: string): (path: string) => boolean {
  return picomatch(pattern, { dot: true });
}
