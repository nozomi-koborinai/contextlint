import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node.js";
import type {
  Diagnostic,
  InitializeResult,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { LoadedConfig } from "./config-loader.js";
import { tryLoadConfig } from "./config-loader.js";
import { provideCodeActions } from "./code-actions.js";
import { toDiagnostics } from "./diagnostics.js";
import { hoverForDiagnostics } from "./hover.js";
import { lintWorkspace } from "./linter.js";
import { uriToPath } from "./uri.js";
import { WorkspaceCache } from "./workspace.js";

const DEBOUNCE_MS = 500;

function pathToUri(filePath: string): string {
  return `file://${filePath}`;
}

export function start(): void {
  const connection = createConnection(
    ProposedFeatures.all,
    process.stdin,
    process.stdout,
  );
  const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

  let loaded: LoadedConfig | null = null;
  let workspaceRoot: string = process.cwd();
  const cache = new WorkspaceCache();
  const latestDiagnostics = new Map<string, Diagnostic[]>();
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  connection.onInitialize((params): InitializeResult => {
    const firstFolder = params.workspaceFolders?.[0];
    if (firstFolder) {
      workspaceRoot = uriToPath(firstFolder.uri);
    }
    loaded = tryLoadConfig(workspaceRoot);
    if (loaded) {
      const patterns = loaded.config.include ?? ["**/*.md"];
      cache.scan(workspaceRoot, patterns);
      runLint();
    }
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
        codeActionProvider: true,
      },
      serverInfo: { name: "contextlint-lsp" },
    };
  });

  documents.onDidChangeContent((event) => {
    const filePath = uriToPath(event.document.uri);
    cache.updateFromBuffer(filePath, event.document.getText());
    scheduleLint();
  });

  documents.onDidClose(() => {
    // Keep the cache and diagnostics so Problems panel entries persist
    // when the user closes the editor tab. The on-disk version will be
    // picked up on the next `cache.scan` (e.g. workspace reload).
  });

  connection.onHover((params) => {
    const diagnostics = latestDiagnostics.get(params.textDocument.uri) ?? [];
    return hoverForDiagnostics(params, diagnostics);
  });

  connection.onCodeAction((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];
    return provideCodeActions(params, document);
  });

  documents.listen(connection);
  connection.listen();

  function scheduleLint(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      runLint();
    }, DEBOUNCE_MS);
  }

  function runLint(): void {
    if (!loaded) return;

    let perFileDiagnostics: Map<string, Diagnostic[]>;
    try {
      const raw = lintWorkspace(cache, loaded.config, workspaceRoot);
      perFileDiagnostics = new Map();
      for (const [filePath, messages] of raw) {
        if (filePath === "<project>") continue;
        perFileDiagnostics.set(filePath, toDiagnostics(messages));
      }
    } catch (error) {
      connection.console.error(
        `contextlint: lint failed: ${String(error)}`,
      );
      return;
    }

    // Publish current diagnostics for every cached file (empty arrays
    // clear stale violations the user just fixed).
    for (const [filePath, diagnostics] of perFileDiagnostics) {
      const uri = pathToUri(filePath);
      latestDiagnostics.set(uri, diagnostics);
      void connection.sendDiagnostics({ uri, diagnostics });
    }

    // Clear diagnostics for URIs that were tracked earlier but no longer
    // appear in the lint result (e.g. a file was removed from the cache).
    for (const uri of [...latestDiagnostics.keys()]) {
      const filePath = uriToPath(uri);
      if (!perFileDiagnostics.has(filePath)) {
        latestDiagnostics.set(uri, []);
        void connection.sendDiagnostics({ uri, diagnostics: [] });
      }
    }
  }
}
