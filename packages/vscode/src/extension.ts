import { workspace } from "vscode";
import type { ExtensionContext } from "vscode";
import { LanguageClient, TransportKind } from "vscode-languageclient/node";
import type {
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(_context: ExtensionContext): void {
  const enabled = workspace
    .getConfiguration("contextlint")
    .get<boolean>("enable", true);
  if (!enabled) return;

  const serverModule = require.resolve("@contextlint/lsp-server");

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: { module: serverModule, transport: TransportKind.stdio },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "markdown" }],
  };

  client = new LanguageClient(
    "contextlint",
    "contextlint",
    serverOptions,
    clientOptions,
  );

  void client.start();
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
