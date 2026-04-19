import { loadDocuments, parseDocument } from "@contextlint/core";
import type { ParsedDocument } from "@contextlint/core";

/**
 * In-memory cache of parsed Markdown documents that make up the LSP
 * workspace. Populated by `scan` on startup (from disk) and updated
 * by `updateFromBuffer` when a file changes in the editor.
 *
 * Keys are absolute, forward-slash normalized file paths — matching
 * the shape `@contextlint/core`'s `loadDocuments` produces.
 */
export class WorkspaceCache {
  private docs: Map<string, ParsedDocument> = new Map();

  scan(root: string, patterns: string[]): void {
    this.docs = loadDocuments(patterns, root);
  }

  updateFromBuffer(filePath: string, content: string): void {
    this.docs.set(filePath, parseDocument(content));
  }

  delete(filePath: string): void {
    this.docs.delete(filePath);
  }

  documents(): Map<string, ParsedDocument> {
    return this.docs;
  }

  size(): number {
    return this.docs.size;
  }

  has(filePath: string): boolean {
    return this.docs.has(filePath);
  }
}
