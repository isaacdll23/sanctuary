import assert from "node:assert/strict";
import { createServer, get } from "node:http";
import test from "node:test";
import request from "supertest";
import { createPhase0McpApp, LifecycleController, loadPhase0McpConfig, type Phase0McpConfig } from "./RemoteMcpPhase0Server";

const token = "explicit-test-token";
const config: Phase0McpConfig = {
  bearerToken: token,
  publicUrl: new URL("https://mcp.example.test/mcp"),
  issuerUrl: new URL("https://issuer.example.test/"),
  allowedHosts: ["mcp.example.test", "localhost"],
  allowedOrigins: ["mcp.example.test", "localhost"],
  drainTimeoutMs: 100,
};
const headers = (method: string, name?: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": method, Host: "mcp.example.test", ...(name === undefined ? {} : { "Mcp-Name": name }) });
const envelope = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": { name: "phase-0-test", version: "0.0.0" } };
const rpc = (id: number, method: string, params: Record<string, unknown> = {}) => ({ jsonrpc: "2.0", id, method, params: { ...params, _meta: envelope } });
const app = () => createPhase0McpApp(config);

async function bounded<T>(promise: Promise<T>, timeoutMs: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<undefined>((resolve) => {
      timer = setTimeout(() => resolve(undefined), timeoutMs);
    })]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

test("is isolated to MCP, discovery, and health routes", async () => {
  const server = app();
  assert.equal((await request(server).get("/")).status, 404);
  assert.equal((await request(server).get("/health/live")).status, 200);
   assert.equal((await request(server).get("/health/ready")).status, 200);
   const metadata = await request(server).get("/.well-known/oauth-protected-resource/mcp");
   assert.deepEqual(metadata.body.resource, config.publicUrl.toString());
   assert.deepEqual(metadata.body.authorization_servers, [config.issuerUrl.toString()]);
   assert.equal((await request(server).get("/health/live/")).status, 404);
   assert.equal((await request(server).get("/health/ready/")).status, 404);
   assert.equal((await request(server).get("/.well-known/oauth-protected-resource/mcp/")).status, 404);
});

test("fails closed for missing, cookie-only, and invalid bearer auth", async () => {
  const server = app();
  const body = rpc(1, "server/discover");
  assert.equal((await request(server).post("/mcp").set(headers("server/discover")).unset("Authorization").send(body)).status, 401);
  assert.equal((await request(server).post("/mcp").set({ ...headers("server/discover"), Cookie: "session=user" }).unset("Authorization").send(body)).status, 401);
  const invalid = await request(server).post("/mcp").set({ ...headers("server/discover"), Authorization: "Bearer wrong-token" }).send(body);
  assert.equal(invalid.status, 401);
  assert.equal(JSON.stringify(invalid.body).includes(token), false);
  assert.match(invalid.headers["www-authenticate"], /resource_metadata="https:\/\/mcp\.example\.test\/\.well-known\/oauth-protected-resource\/mcp"/);
});

test("serves modern discovery, list, and call with SDK AuthInfo", async () => {
  let clientId = "";
  const server = createPhase0McpApp(config, (auth) => { clientId = auth.clientId; });
  assert.equal((await request(server).post("/mcp").set(headers("server/discover")).send(rpc(1, "server/discover"))).status, 200);
  const list = await request(server).post("/mcp").set(headers("tools/list")).send(rpc(2, "tools/list"));
  assert.equal(list.body.result.tools[0].name, "phase_0_ping");
  const call = await request(server).post("/mcp").set(headers("tools/call", "phase_0_ping")).send(rpc(3, "tools/call", { name: "phase_0_ping", arguments: {} }));
  assert.equal(call.body.result.content[0].text, "phase-0-ok");
  assert.equal(call.headers["mcp-session-id"], undefined);
  assert.equal(clientId, "phase-0-client");
});

test("rejects origin and host mismatch and legacy transport methods", async () => {
  const server = app();
  const body = rpc(1, "tools/list");
  assert.equal((await request(server).post("/mcp").set({ ...headers("tools/list"), Origin: "https://evil.example" }).send(body)).status, 403);
  assert.equal((await request(server).post("/mcp").set({ ...headers("tools/list"), Host: "evil.example" }).send(body)).status, 403);
  assert.equal((await request(server).get("/mcp").set(headers("tools/list"))).status, 405);
  assert.equal((await request(server).delete("/mcp").set(headers("tools/list"))).status, 405);
  assert.equal((await request(server).post("/mcp").set(headers("tools/list")).send(rpc(1, "tools/list"))).status, 200);
   assert.equal((await request(server).get("/mcp/unexpected")).status, 404);
   assert.equal((await request(server).post("/mcp/").set(headers("tools/list")).send(body)).status, 404);
});

test("auth runs before body parsing and the SDK owns protocol negatives", async () => {
  const server = app();
  const unauthenticated = await request(server).post("/mcp").set(headers("tools/list")).unset("Authorization").send("{");
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers["www-authenticate"], /^Bearer /);

  const malformed = await request(server).post("/mcp").set(headers("tools/list")).send("{");
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.code, -32700);

   const missingVersion = await request(server).post("/mcp").set(headers("tools/list")).unset("MCP-Protocol-Version").send(rpc(1, "tools/list"));
  assert.equal(missingVersion.status, 400);
  assert.equal(missingVersion.body.error.code, -32022);

   const missingMethod = await request(server).post("/mcp").set(headers("tools/list")).unset("Mcp-Method").send(rpc(1, "tools/list"));
  assert.equal(missingMethod.status, 400);
   assert.equal(missingMethod.body.error.code, -32020);

   const missingName = await request(server).post("/mcp").set(headers("tools/call")).send(rpc(1, "tools/call", { name: "phase_0_ping", arguments: {} }));
   assert.equal(missingName.status, 400);
   assert.equal(missingName.body.error.code, -32021);

   const mismatchedMethod = await request(server).post("/mcp").set(headers("tools/call", "phase_0_ping")).send(rpc(1, "tools/list"));
   assert.equal(mismatchedMethod.status, 400);
   assert.equal(mismatchedMethod.body.error.code, -32020);

   const mismatchedName = await request(server).post("/mcp").set(headers("tools/call", "wrong_name")).send(rpc(1, "tools/call", { name: "phase_0_ping", arguments: {} }));
   assert.equal(mismatchedName.status, 400);
   assert.equal(mismatchedName.body.error.code, -32020);

   const mismatchedVersion = await request(server).post("/mcp").set({ ...headers("tools/list"), "MCP-Protocol-Version": "2025-11-25" }).send(rpc(1, "tools/list"));
   assert.equal(mismatchedVersion.status, 400);
   assert.equal(mismatchedVersion.body.error.code, -32020);

  const invalidContentType = await request(server).post("/mcp").set({ ...headers("tools/list"), "Content-Type": "text/plain" }).send(JSON.stringify(rpc(1, "tools/list")));
   assert.equal(invalidContentType.status, 415);

   const missingAccept = await request(server).post("/mcp").set(headers("tools/list")).unset("Accept").send(rpc(1, "tools/list"));
   assert.equal(missingAccept.status, 200);
   const unacceptable = await request(server).post("/mcp").set({ ...headers("tools/list"), Accept: "text/plain" }).send(rpc(1, "tools/list"));
   assert.equal(unacceptable.status, 200);
});

test("readiness and new work are rejected while draining", async () => {
  const server = app();
  assert.equal((await request(server).post("/mcp").set(headers("tools/list")).send(rpc(1, "tools/list"))).status, 200);
  const draining = server.lifecycle.drain(100);
  assert.equal((await request(server).get("/health/live")).status, 200);
  assert.equal((await request(server).get("/health/ready")).status, 503);
  assert.equal((await request(server).post("/mcp").set(headers("tools/list")).send(rpc(2, "tools/list"))).status, 503);
  await draining;
});

test("drain waits for accepted work but has a bounded deadline", async () => {
   const lifecycle = new LifecycleController();
   assert.equal(lifecycle.acceptRequest(), true);
   const completed = lifecycle.drain(100);
   const completionTimer = setTimeout(() => lifecycle.completeRequest(), 5);
   try {
     await completed;
   } finally {
     clearTimeout(completionTimer);
   }
  assert.equal(lifecycle.acceptRequest(), false);
});

test("server drain force-closes a request that does not finish", { timeout: 1_000 }, async () => {
  const serverApp = app();
  serverApp.get("/never", (_req, res) => {
    assert.equal(serverApp.lifecycle.acceptRequest(), true);
    const untrack = serverApp.lifecycle.trackResource(() => res.destroy());
    res.once("close", () => { untrack(); serverApp.lifecycle.completeRequest(); });
  });
   const httpServer = createServer(serverApp);
   let hangingRequest: ReturnType<typeof get> | undefined;
   let response: import("node:http").IncomingMessage | undefined;
   let onResponseClose: (() => void) | undefined;
   let removeRequestListeners: (() => void) | undefined;
   let requestDelayTimer: ReturnType<typeof setTimeout> | undefined;
   try {
     await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
     const address = httpServer.address();
     assert.notEqual(address, null);
     const port = typeof address === "object" && address !== null ? address.port : 0;
     const responseClosed = new Promise<void>((resolve) => {
       const req = hangingRequest = get({ host: "127.0.0.1", port, path: "/never" });
       const onError = (): void => resolve();
       const onResponse = (incomingResponse: import("node:http").IncomingMessage): void => {
         response = incomingResponse;
         onResponseClose = resolve;
         incomingResponse.once("close", onResponseClose);
       };
       req.once("error", onError);
       req.once("response", onResponse);
       removeRequestListeners = () => {
         req.removeListener("error", onError);
         req.removeListener("response", onResponse);
         if (response !== undefined && onResponseClose !== undefined) response.removeListener("close", onResponseClose);
       };
     });
     await new Promise<void>((resolve) => { requestDelayTimer = setTimeout(resolve, 5); });
     await serverApp.lifecycle.drain(20);
     if (await bounded(responseClosed, 100) === undefined) hangingRequest?.destroy();
     assert.equal(serverApp.lifecycle.isDraining, true);
   } finally {
     if (requestDelayTimer !== undefined) clearTimeout(requestDelayTimer);
     removeRequestListeners?.();
     hangingRequest?.destroy();
     const closePromise = new Promise<void>((resolve) => {
        if (!httpServer.listening) { resolve(); return; }
        httpServer.close(() => resolve());
     });
     httpServer.closeAllConnections();
     httpServer.closeIdleConnections();
     if (await bounded(closePromise, 500) === undefined) {
       httpServer.closeAllConnections();
       httpServer.closeIdleConnections();
     }
   }
});

test("requires explicit startup configuration", () => {
  assert.throws(() => loadPhase0McpConfig({}), /MCP_PHASE_0_BEARER_TOKEN is required/);
  assert.throws(() => loadPhase0McpConfig({ MCP_PHASE_0_BEARER_TOKEN: "x" }), /MCP_PHASE_0_PUBLIC_URL is required/);
  const base = { MCP_PHASE_0_BEARER_TOKEN: "x", MCP_PHASE_0_PUBLIC_URL: "https://mcp.example.test/mcp", MCP_PHASE_0_ISSUER_URL: "https://issuer.example.test/", MCP_PHASE_0_ALLOWED_HOSTS: "mcp.example.test", MCP_PHASE_0_ALLOWED_ORIGINS: "mcp.example.test" };
  assert.throws(() => loadPhase0McpConfig({ ...base, MCP_PHASE_0_PUBLIC_URL: "https://user:secret@mcp.example.test/mcp" }), /must not contain credentials/);
  assert.throws(() => loadPhase0McpConfig({ ...base, MCP_PHASE_0_ISSUER_URL: "https://issuer.example.test/?secret=1" }), /must not contain a query or fragment/);
  assert.throws(() => loadPhase0McpConfig({ ...base, MCP_PHASE_0_PUBLIC_URL: "http://mcp.example.test/mcp" }), /must use HTTPS/);
  assert.equal(loadPhase0McpConfig({ ...base, MCP_PHASE_0_PUBLIC_URL: "http://127.0.0.1/mcp", MCP_PHASE_0_ISSUER_URL: "http://localhost/", MCP_PHASE_0_ALLOWED_HOSTS: "127.0.0.1", MCP_PHASE_0_ALLOWED_ORIGINS: "localhost", MCP_PHASE_0_ALLOW_INSECURE_LOOPBACK: "true" }).allowInsecureLoopback, true);
});
