/**
 * LSP smoke test for @contextlint/lsp-server.
 *
 * Spawns the built server, runs the LSP handshake, opens a fixture Markdown
 * document that violates TBL-001, and asserts publishDiagnostics comes back
 * with at least one TBL-001 diagnostic.
 *
 * Usage:
 *   bun run --filter '@contextlint/lsp-server' build
 *   node packages/lsp-server/scripts/smoke.mjs
 *
 * A custom server entrypoint can be passed as the first argument; defaults to
 * the sibling dist/index.js.
 *
 * Exit code: 0 on success, 1 on failure.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH =
  process.argv[2] ?? join(here, "..", "dist", "index.js");

const root = mkdtempSync(join(tmpdir(), "lsp-smoke-"));
writeFileSync(
  join(root, "contextlint.config.json"),
  JSON.stringify(
    {
      rules: [
        {
          rule: "tbl001",
          options: { requiredColumns: ["ID", "Status"] },
        },
      ],
    },
    null,
    2,
  ),
);

const mdPath = join(root, "fixture.md");
writeFileSync(
  mdPath,
  "# Fixture\n\n| Name | Age |\n|------|-----|\n| A    | 30  |\n",
);

const child = spawn("node", [SERVER_PATH], {
  stdio: ["pipe", "pipe", "inherit"],
});

function write(message) {
  const body = JSON.stringify(message);
  const header = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`;
  child.stdin.write(header + body);
}

let buffer = Buffer.alloc(0);
const messages = [];

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd < 0) break;
    const header = buffer.slice(0, headerEnd).toString("utf-8");
    const match = /Content-Length: (\d+)/.exec(header);
    if (!match) break;
    const contentLength = Number.parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + contentLength) break;
    const body = buffer
      .slice(bodyStart, bodyStart + contentLength)
      .toString("utf-8");
    buffer = buffer.slice(bodyStart + contentLength);
    messages.push(JSON.parse(body));
  }
});

child.on("error", (err) => {
  console.error("spawn error:", err);
  process.exit(1);
});

write({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    processId: process.pid,
    rootUri: `file://${root}`,
    workspaceFolders: [{ uri: `file://${root}`, name: "smoke" }],
    capabilities: {},
  },
});

setTimeout(() => {
  write({ jsonrpc: "2.0", method: "initialized", params: {} });
  write({
    jsonrpc: "2.0",
    method: "textDocument/didOpen",
    params: {
      textDocument: {
        uri: `file://${mdPath}`,
        languageId: "markdown",
        version: 1,
        text: readFileSync(mdPath, "utf-8"),
      },
    },
  });
}, 150);

setTimeout(() => {
  const initResp = messages.find((m) => m.id === 1);
  if (!initResp) {
    console.error("FAIL: no initialize response");
    child.kill();
    process.exit(1);
  }
  console.log(
    "initialize ok, capabilities:",
    JSON.stringify(initResp.result.capabilities, null, 2),
  );

  const diag = messages.find(
    (m) => m.method === "textDocument/publishDiagnostics",
  );
  if (!diag) {
    console.error("FAIL: no publishDiagnostics received");
    console.error("all messages:", JSON.stringify(messages, null, 2));
    child.kill();
    process.exit(1);
  }
  const diagnostics = diag.params.diagnostics;
  console.log(`got ${diagnostics.length} diagnostic(s):`);
  for (const d of diagnostics) {
    console.log(`  [${d.severity}] ${d.code}: ${d.message}`);
  }

  const codes = new Set(diagnostics.map((d) => d.code));
  if (!codes.has("TBL-001")) {
    console.error("FAIL: expected TBL-001 diagnostic not present");
    child.kill();
    process.exit(1);
  }

  console.log("PASS");
  child.kill();
  process.exit(0);
}, 1500);
