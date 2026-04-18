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
import { toDiagnostics } from "./diagnostics.js";
import { hoverForDiagnostics } from "./hover.js";
import { lintBuffer } from "./linter.js";
import { uriToPath } from "./uri.js";

const DEBOUNCE_MS = 300;

export function start(): void {
  const connection = createConnection(ProposedFeatures.all);
  const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

  let loaded: LoadedConfig | null = null;
  let workspaceRoot: string = process.cwd();
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const latestDiagnostics = new Map<string, Diagnostic[]>();

  connection.onInitialize((params): InitializeResult => {
    const firstFolder = params.workspaceFolders?.[0];
    if (firstFolder) {
      workspaceRoot = uriToPath(firstFolder.uri);
    }
    loaded = tryLoadConfig(workspaceRoot);
    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        hoverProvider: true,
      },
      serverInfo: { name: "contextlint-lsp" },
    };
  });

  documents.onDidChangeContent((event) => {
    scheduleLint(event.document);
  });

  documents.onDidClose((event) => {
    const existing = debounceTimers.get(event.document.uri);
    if (existing) {
      clearTimeout(existing);
      debounceTimers.delete(event.document.uri);
    }
    latestDiagnostics.delete(event.document.uri);
    void connection.sendDiagnostics({
      uri: event.document.uri,
      diagnostics: [],
    });
  });

  connection.onHover((params) => {
    const diagnostics = latestDiagnostics.get(params.textDocument.uri) ?? [];
    return hoverForDiagnostics(params, diagnostics);
  });

  documents.listen(connection);
  connection.listen();

  function scheduleLint(document: TextDocument): void {
    const existing = debounceTimers.get(document.uri);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      debounceTimers.delete(document.uri);
      runLint(document);
    }, DEBOUNCE_MS);
    debounceTimers.set(document.uri, timer);
  }

  function runLint(document: TextDocument): void {
    if (!loaded) {
      void connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      return;
    }
    let diagnostics: Diagnostic[];
    try {
      const messages = lintBuffer(document, loaded.config);
      diagnostics = toDiagnostics(messages);
    } catch (error) {
      connection.console.error(
        `contextlint: lint failed for ${document.uri}: ${String(error)}`,
      );
      diagnostics = [];
    }
    latestDiagnostics.set(document.uri, diagnostics);
    void connection.sendDiagnostics({ uri: document.uri, diagnostics });
  }
}
