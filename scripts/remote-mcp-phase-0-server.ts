import { createServer } from "node:http";
import { createPhase0McpApp, loadPhase0McpConfig } from "../app/modules/remote-mcp-phase-0/RemoteMcpPhase0Server";

const config = loadPhase0McpConfig();
const app = createPhase0McpApp(config);
const server = createServer(app);
let shuttingDown = false;
const closeServer = (): Promise<void> => new Promise((resolve, reject) => {
  if (!server.listening) { resolve(); return; }
  server.close((error) => error === undefined ? resolve() : reject(error));
});
const drain = async (): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;
  // Stop accepting connections before waiting for already-tracked responses.
  // The hard deadline below covers a close callback that never arrives.
  const closePromise = closeServer();
  const hardDeadline = setTimeout(() => {
    server.closeAllConnections();
    server.closeIdleConnections();
    process.exitCode = 1;
    process.removeListener("SIGTERM", onSigterm);
    process.removeListener("SIGINT", onSigint);
    process.exit(1);
  }, config.drainTimeoutMs);
  try {
    await app.lifecycle.drain(config.drainTimeoutMs);
    server.closeAllConnections();
    server.closeIdleConnections();
    await closePromise;
    process.exitCode = 0;
  } catch (error) {
    process.exitCode = 1;
    console.error("MCP server shutdown failed", error instanceof Error ? error.message : "unknown error");
  } finally {
    // The lifecycle closes tracked responses at the deadline; this also closes
    // keep-alive sockets which have not entered request tracking.
    clearTimeout(hardDeadline);
    server.closeAllConnections();
    server.closeIdleConnections();
    try { await closePromise; } catch (error) {
      process.exitCode = 1;
      console.error("MCP server close failed", error instanceof Error ? error.message : "unknown error");
    }
    process.removeListener("SIGTERM", onSigterm);
    process.removeListener("SIGINT", onSigint);
  }
};
const onSigterm = (): void => { void drain(); };
const onSigint = (): void => { void drain(); };
process.once("SIGTERM", onSigterm);
process.once("SIGINT", onSigint);
server.listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? "127.0.0.1", () => console.log("Standalone MCP process listening"));
