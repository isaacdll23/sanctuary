import {
  createMcpHandler,
  McpServer,
  OAuthError,
  OAuthErrorCode,
  type AuthInfo,
} from "@modelcontextprotocol/server";
import { hostHeaderValidation, originValidation, requireBearerAuth } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import express, { type Express, type RequestHandler } from "express";

export const PHASE_0_PROTOCOL_VERSION = "2026-07-28";
export const PHASE_0_CLIENT_ID = "phase-0-client";
export type AuthObserver = (authInfo: AuthInfo) => void;

export type Phase0McpConfig = Readonly<{
  bearerToken: string;
  publicUrl: URL;
  issuerUrl: URL;
  allowedHosts: readonly string[];
  allowedOrigins: readonly string[];
  drainTimeoutMs: number;
  allowInsecureLoopback?: boolean;
}>;

export type Phase0McpApp = Express & { lifecycle: LifecycleController; config: Phase0McpConfig };

/** A small, deterministic process lifecycle state machine used by HTTP and signals. */
export class LifecycleController {
  private draining = false;
  private activeRequests = 0;
  private drainPromise: Promise<void> | undefined;
  private readonly activeResources = new Set<() => void>();
  private onCompletion: (() => void) | undefined;

  get isDraining(): boolean { return this.draining; }
  get isReady(): boolean { return !this.draining; }

  acceptRequest(): boolean {
    if (this.draining) return false;
    this.activeRequests += 1;
    return true;
  }

  completeRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.onCompletion?.();
  }

  trackResource(close: () => void): () => void {
    this.activeResources.add(close);
    return () => this.activeResources.delete(close);
  }

  drain(timeoutMs: number): Promise<void> {
    if (this.drainPromise !== undefined) return this.drainPromise;
    this.draining = true;
    this.drainPromise = new Promise((resolve) => {
      if (this.activeRequests === 0) { resolve(); return; }
      let settled = false;
      let deadline: ReturnType<typeof setTimeout>;
      const finish = (force: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        this.onCompletion = undefined;
        if (force) {
          for (const close of [...this.activeResources]) {
            try { close(); } catch { /* A later close must still be attempted. */ }
          }
        }
        resolve();
      };
      this.onCompletion = () => { if (this.activeRequests === 0) finish(false); };
      deadline = setTimeout(() => finish(true), timeoutMs);
      if (this.activeRequests === 0) finish(false);
    });
    return this.drainPromise;
  }
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function validUrl(value: string, name: string, allowInsecureLoopback: boolean): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${name} must be an absolute URL`); }
  if (url.username || url.password) throw new Error(`${name} must not contain credentials`);
  if (url.search || url.hash) throw new Error(`${name} must not contain a query or fragment`);
  if (url.protocol !== "https:" && !(allowInsecureLoopback && url.protocol === "http:" && isLoopback(url.hostname))) throw new Error(`${name} must use HTTPS`);
  return url;
}

function validateConfig(config: Phase0McpConfig): Phase0McpConfig {
  if (config.bearerToken.length === 0) throw new Error("bearerToken is required");
  if (config.allowedHosts.length === 0 || config.allowedOrigins.length === 0) throw new Error("host and origin allowlists are required");
  if (!Number.isInteger(config.drainTimeoutMs) || config.drainTimeoutMs < 1) throw new Error("drainTimeoutMs must be a positive integer");
  const allowInsecureLoopback = config.allowInsecureLoopback === true;
  if (!(config.publicUrl instanceof URL) || config.publicUrl.pathname !== "/mcp") throw new Error("publicUrl must be the canonical /mcp URL");
  validUrl(config.publicUrl.toString(), "publicUrl", allowInsecureLoopback);
  if (!(config.issuerUrl instanceof URL)) throw new Error("issuerUrl must be an absolute URL");
  validUrl(config.issuerUrl.toString(), "issuerUrl", allowInsecureLoopback);
  if (allowInsecureLoopback && (!isLoopback(config.publicUrl.hostname) || !isLoopback(config.issuerUrl.hostname))) throw new Error("insecure URLs are permitted only for loopback development");
  for (const hostname of [...config.allowedHosts, ...config.allowedOrigins]) {
    if (hostname.length === 0 || hostname.includes("/") || hostname.includes("://")) throw new Error("allowlists must contain hostnames only");
  }
  return config;
}

export function loadPhase0McpConfig(env: NodeJS.ProcessEnv = process.env): Phase0McpConfig {
  const bearerToken = env.MCP_PHASE_0_BEARER_TOKEN;
  const publicUrl = env.MCP_PHASE_0_PUBLIC_URL;
  const issuerUrl = env.MCP_PHASE_0_ISSUER_URL;
  const hosts = env.MCP_PHASE_0_ALLOWED_HOSTS?.split(",").map((value) => value.trim()).filter(Boolean);
  const origins = env.MCP_PHASE_0_ALLOWED_ORIGINS?.split(",").map((value) => value.trim()).filter(Boolean);
  if (bearerToken === undefined || bearerToken.length === 0) throw new Error("MCP_PHASE_0_BEARER_TOKEN is required");
  if (publicUrl === undefined) throw new Error("MCP_PHASE_0_PUBLIC_URL is required");
  if (issuerUrl === undefined) throw new Error("MCP_PHASE_0_ISSUER_URL is required");
  if (hosts === undefined || hosts.length === 0) throw new Error("MCP_PHASE_0_ALLOWED_HOSTS is required");
  if (origins === undefined || origins.length === 0) throw new Error("MCP_PHASE_0_ALLOWED_ORIGINS is required");
  const drainTimeoutMs = Number(env.MCP_PHASE_0_DRAIN_TIMEOUT_MS ?? 10_000);
  if (!Number.isInteger(drainTimeoutMs) || drainTimeoutMs < 1) throw new Error("MCP_PHASE_0_DRAIN_TIMEOUT_MS must be a positive integer");
  const allowInsecureLoopback = env.MCP_PHASE_0_ALLOW_INSECURE_LOOPBACK === "true";
  return { bearerToken, publicUrl: validUrl(publicUrl, "MCP_PHASE_0_PUBLIC_URL", allowInsecureLoopback), issuerUrl: validUrl(issuerUrl, "MCP_PHASE_0_ISSUER_URL", allowInsecureLoopback), allowedHosts: hosts, allowedOrigins: origins, drainTimeoutMs, allowInsecureLoopback };
}

function createServer(authObserver?: AuthObserver): McpServer {
  const server = new McpServer({ name: "sanctuary-phase-0-spike", version: "0.0.0" });
  server.registerTool("phase_0_ping", { title: "Phase 0 ping", description: "Returns a deterministic transport-prototype response.", inputSchema: {} }, async (_input, context) => {
    const authInfo = context.http?.authInfo;
    if (authInfo !== undefined) authObserver?.(authInfo);
    return { content: [{ type: "text", text: "phase-0-ok" }] };
  });
  return server;
}

function metadata(config: Phase0McpConfig): Record<string, unknown> {
  return { resource: config.publicUrl.toString(), authorization_servers: [config.issuerUrl.toString()], scopes_supported: [], resource_name: "Sanctuary MCP" };
}

function requiredProtocolHeaders(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const version = req.get("MCP-Protocol-Version");
  const method = req.get("Mcp-Method");
  const name = req.get("Mcp-Name");
  if (version === undefined) {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32022, message: "MCP-Protocol-Version header is required" }, id: null });
    return;
  }
  if (method === undefined) {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32020, message: "Mcp-Method header is required" }, id: null });
    return;
  }
  if (["tools/call", "resources/read", "prompts/get"].includes(method) && name === undefined) {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32021, message: "Mcp-Name header is required" }, id: null });
    return;
  }
  next();
}

export function createPhase0McpApp(config: Phase0McpConfig, authObserver?: AuthObserver): Phase0McpApp {
  validateConfig(config);
  const app = express() as Phase0McpApp;
  app.set("strict routing", true);
  const lifecycle = new LifecycleController();
  app.lifecycle = lifecycle;
  app.config = config;
  const mcpHandler = createMcpHandler(({ authInfo }) => createServer(authInfo === undefined ? undefined : authObserver), { legacy: "reject", responseMode: "json" });
  const nodeHandler = toNodeHandler(mcpHandler);
  const trackRequest: RequestHandler = (_req, res, next) => {
    if (!lifecycle.acceptRequest()) { res.status(503).json({ error: "draining" }); return; }
    let completed = false;
    const untrack = lifecycle.trackResource(() => res.destroy());
    const complete = (): void => { if (!completed) { completed = true; untrack(); lifecycle.completeRequest(); } };
    res.once("finish", complete);
    res.once("close", complete);
    next();
  };

  app.get("/.well-known/oauth-protected-resource/mcp", (_req, res) => res.json(metadata(config)));
  app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
  app.get("/health/ready", (_req, res) => res.status(lifecycle.isReady ? 200 : 503).json({ status: lifecycle.isReady ? "ready" : "draining", database: "deferred" }));
  const mcpMiddleware: RequestHandler[] = [trackRequest, hostHeaderValidation([...config.allowedHosts]), originValidation([...config.allowedOrigins]), requireBearerAuth({
    verifier: { async verifyAccessToken(candidate) {
      if (candidate !== config.bearerToken) throw new OAuthError(OAuthErrorCode.InvalidToken, "invalid bearer credential");
      return { token: candidate, clientId: PHASE_0_CLIENT_ID, scopes: [], expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    } },
    resourceMetadataUrl: `${config.publicUrl.origin}/.well-known/oauth-protected-resource/mcp`,
  }), requiredProtocolHeaders, (req, res) => void nodeHandler(req, res)];
  app.post("/mcp", ...mcpMiddleware);
  app.all("/mcp", (_req, res) => res.status(405).set("Allow", "POST").json({ error: "method not allowed" }));
  return app;
}
