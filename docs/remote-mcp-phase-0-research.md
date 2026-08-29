# Remote MCP Finance: Phase 0 Research

**Research date:** 2026-08-25
**Status labels:** **documentation-confirmed** means stated by an authoritative
source; **locally tested** means exercised in this repository or against a
running service; **inferred** means a reasoned conclusion from confirmed facts;
**unknown** means the public evidence is insufficient. No client or Auth0
tenant interoperability test was run for this deliverable.

## Methodology and scope

I read `docs/CODING_STANDARDS.md`,
`plans/remote-mcp-finance-plan.md`, the repository manifests and runtime
configuration, then checked the dated MCP 2026-07-28 specification, the v2
TypeScript SDK documentation and npm package records, current first-party
client documentation, and Auth0 documentation. Links below were fetched
successfully unless explicitly marked otherwise. This document now records the
Phase 0 transport spike and its local wire evidence. The finance plan was
available and is treated as the governing architecture decision record for this
update.

## Executive recommendation

**Go for a smallest modern standalone MCP transport prototype, but do not yet
claim client interoperability or Auth0 compatibility.** The existing local
wire spike is a disposable combined mounting experiment; the next prototype
must run MCP as a separately started process with one harmless tool,
Streamable HTTP, the 2026-07-28 request model, no MCP session state, and a test
bearer verifier/stub. Its route surface should be `POST /mcp`,
protected-resource discovery, and health/readiness endpoints only—no browser
session or web UI routes. Exercise it with raw HTTP assertions and attempt the
Inspector CLI; the installed CLI did not expose the documented modern mode.
Add OAuth and each host only after the endpoint passes the protocol gates below.

The plan's choice of Streamable HTTP and its `Mcp-Method`/`Mcp-Name` header
requirement is correct for 2026-07-28. The plan's statement that the SDK can
provide “Express handler” support needs one implementation clarification:
v2's primary API is a web-standard `createMcpHandler` mounted with
`toNodeHandler`; the optional `@modelcontextprotocol/express` package supplies
Express setup and auth/metadata helpers. It is not a replacement for the
existing React Router handler. The combined Express/React Router mounting
experiment remains useful SDK evidence, but its mounting topology is
exploratory and non-production. Production should use one repository with
shared transport-neutral server-side domain modules and a separate MCP
process/container, while the web deployment retains `react-router-serve`.

## Protocol and SDK findings

| Question | Conclusion | Evidence/status |
|---|---|---|
| Remote standard transport | Streamable HTTP: one endpoint, POST per JSON-RPC request, JSON or request-scoped SSE response. HTTP+SSE is deprecated; stdio is for a client-launched local process. | **documentation-confirmed** — [transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) |
| 2026-07-28 transport shape | GET stream, DELETE session termination, `Mcp-Session-Id`, resumable `Last-Event-ID`, and protocol-level sessions are removed. A 2026 server is per-request/sessionless. | **documentation-confirmed** — [Streamable HTTP changes and compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#backward-compatibility) |
| Version negotiation | There is no `initialize` method in the SDK's modern dispatch registry. Modern requests carry `_meta` protocol version and HTTP also requires `MCP-Protocol-Version`; `server/discover` is the modern discovery operation. Unsupported versions return a typed error listing supported versions. | **documentation-confirmed**, then **locally tested**; the earlier “successful initialize” expectation was disproven by SDK v2.0.0 (`-32601 Method not found`). |
| Required standard headers | `MCP-Protocol-Version` is required on every POST; `Mcp-Method` is required on all requests; `Mcp-Name` is required for `tools/call`, `resources/read`, and `prompts/get`. Header/body values must agree. | **documentation-confirmed** — [request metadata](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#request-metadata) |
| Are `Mcp-Method` and `Mcp-Name` real standard headers? | **Yes.** They are not project-specific or invented names in this revision. They are normative Streamable HTTP headers. | **documentation-confirmed** — same request-metadata source; no local wire test performed |
| Origin and authentication | Validate `Origin` when present, reject invalid origins with 403, and authenticate HTTP connections. Bearer tokens use `Authorization: Bearer`; invalid/expired tokens are 401 and insufficient scope is 403. | **documentation-confirmed** — [transport security](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#security--endpoint), [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) |
| SDK v2 existence/stability | v2 exists and is the stable release line published with the 2026-07-28 spec. | **documentation-confirmed** — [official SDK README](https://github.com/modelcontextprotocol/typescript-sdk), [v2 docs](https://ts.sdk.modelcontextprotocol.io/v2/), [npm server record](https://www.npmjs.com/package/@modelcontextprotocol/server) |
| SDK package recommendation | Pin `@modelcontextprotocol/server@2.0.0`, `@modelcontextprotocol/node@2.0.0`, and `@modelcontextprotocol/express@2.0.0`. Use `createMcpHandler` + `toNodeHandler`; use Express helpers only where useful. | **locally tested**; npm metadata reported exact `2.0.0` latest versions and Node `>=20`. `express@5.1.0` is the direct adapter runtime. |
| Protocol revision existence | `2026-07-28` exists as a dated specification revision and is the v2 SDK target. | **documentation-confirmed** — [specification](https://modelcontextprotocol.io/specification/2026-07-28), [SDK migration note](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28.html) |

### Registration and protected-resource discovery

The MCP authorization specification requires an MCP server to publish OAuth
Protected Resource Metadata (RFC 9728), and clients must use it to locate the
authorization server. The client then obtains a client ID using this priority:
pre-registration, Client ID Metadata Document (CIMD) when advertised, DCR as a
deprecated fallback, then user-entered details. MCP clients must support both
RFC 8414 and OIDC discovery mechanisms for authorization-server metadata.

| Item | Conclusion | Evidence/status |
|---|---|---|
| Protected-resource discovery | Sanctuary must serve metadata for `/mcp` and advertise the Auth0 issuer; a 401 should include `WWW-Authenticate` with `resource_metadata` and the required scope. | **documentation-confirmed** — [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [authorization-server discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery) |
| CIMD | Preferred modern mechanism; client hosts an HTTPS JSON metadata URL used as `client_id`. AS support is advertised by `client_id_metadata_document_supported`. | **documentation-confirmed** — [client registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration) |
| Pre-registration | Supported and appropriate where the AS and client have an established relationship. | **documentation-confirmed** — same source |
| DCR | Deprecated by MCP but supported as a compatibility fallback when the AS exposes `registration_endpoint`. | **documentation-confirmed** — same source |
| Auth0 AS discovery | Auth0 documents OIDC and OAuth metadata URLs, authorization/token/JWKS/revocation endpoints, a registration endpoint, and PKCE methods. | **documentation-confirmed** — [Auth0 OIDC discovery](https://auth0.com/docs/get-started/applications/configure-applications-with-oidc-discovery) |
| Auth0 DCR | Auth0 supports DCR, but it is disabled by default; enabling it permits open registration unless tenant controls restrict it. DCR clients are third-party clients, require PKCE, and need default API permissions. | **documentation-confirmed** — [Auth0 DCR](https://auth0.com/docs/get-started/applications/dynamic-client-registration) |
| Auth0 CIMD | Auth0 public docs confirm standards-based registration for MCP and DCR, but the checked Auth0 metadata examples do not confirm `client_id_metadata_document_supported` or CIMD fetching. | **unknown** — requires checking a real tenant's metadata and an actual CIMD authorization request |
| Auth0 pre-registration | Auth0 applications have fixed client IDs and exact allowed callback URLs; this is publicly documented and is the most conservative fallback. | **documentation-confirmed** — [Auth0 application settings](https://auth0.com/docs/get-started/applications/application-settings); suitability for each host is **inferred** |
| Auth0 token shape for Sanctuary | Auth0 can issue RS256 JWT access tokens for a configured API, with API identifier and permissions/scopes, and exposes JWKS. Exact claims, audience/resource handling, refresh behavior, and tenant policy still require tenant testing. | **documentation-confirmed** for capabilities; **unknown** for the exact Sanctuary configuration |

**Auth0 decision:** Auth0 is not ruled out. Public documentation supports the
needed authorization-code + PKCE, OIDC discovery, API audience, JWKS, scopes,
refresh tokens, and DCR path. Do not assume that Auth0's DCR endpoint alone
solves MCP client registration: CIMD support, default permissions, callback
constraints, resource indicator handling, and the exact access-token claims
must be verified against a tenant. For the prototype, pre-register Inspector
and one selected host, or explicitly enable and constrain DCR in a disposable
tenant. Do not make CIMD a go-live dependency until confirmed.

## Client compatibility matrix

This matrix records documentation only. “No evidence” is deliberately not
treated as “unsupported.” A blank protocol-version cell means the product's
public documentation does not state the exact revision, not that it cannot
send it.

| Target client | Remote transport(s) documented | 2026-07-28/version negotiation | OAuth discovery/registration documented | Legacy SSE/session posture | Status and source |
|---|---|---|---|---|---|
| Claude (Custom Connectors) | Remote MCP URL; transport details are not specified on the checked Claude guide. | Exact revision and negotiation behavior not stated. | Auth is documented generally; CIMD/pre-registration/DCR behavior is not stated. | Unknown from checked docs. | **documentation-confirmed** only for remote custom connectors and authentication; all protocol/registration cells **unknown**. [Claude remote server guide](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers) |
| VS Code / Copilot | `type: "http"` with a URL is documented for remote servers; local command configuration is also documented. | Exact revision and negotiation behavior not stated. | Public MCP server configuration docs do not specify MCP OAuth registration/discovery behavior. | Unknown from checked docs; do not infer SSE support from generic MCP support. | **documentation-confirmed** for HTTP URL configuration; remaining cells **unknown**. [VS Code MCP servers](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) |
| Cursor | `stdio`, SSE, and Streamable HTTP are explicitly documented; remote URL configuration and OAuth are documented. | Exact revision and negotiation behavior not stated. | Static OAuth client credentials and fixed redirect URLs are documented; DCR/CIMD support is not stated. | SSE is documented, but whether a legacy sessionful SSE server is required or merely supported is not stated. | **documentation-confirmed** for transports/static OAuth; revision and CIMD/DCR details **unknown**. [Cursor MCP](https://cursor.com/docs/context/mcp) |
| OpenAI Responses API | Remote servers support Streamable HTTP or HTTP/SSE. The API takes `server_url`; OAuth is supplied as an access token in `authorization`. | Exact revision, header behavior, and negotiation are not stated. | Registration/interactive discovery is outside the API integration; the caller supplies the token. CIMD/pre-registration/DCR are not specified. | HTTP/SSE is explicitly retained as a supported compatibility transport; session details are not stated. | **documentation-confirmed** for transport and supplied-token model; other cells **unknown**. [OpenAI MCP and connectors](https://platform.openai.com/docs/guides/tools-connectors-mcp) |
| MCP Inspector v2 | HTTP/Streamable HTTP, plus other transports through its clients; CLI/TUI/web share core behavior. | Current CLI help exposes `--transport http`, but no usable `modern`/protocol-version option. Its default sent `2025-11-25` and was rejected by this modern-only endpoint. | Full auth flow remains documentation only. | Legacy mode is supported by the tool, not by this endpoint. | **locally tested limitation** with `@modelcontextprotocol/inspector@latest`; the earlier explicit-modern assertion is not true for the installed CLI surface. |

No row above is a hands-on interoperability result. In particular, “supports”
means the vendor documents configuration or behavior, not that Sanctuary was
connected to the product.

## Exploratory mounting implications from this repository

**Locally inspected repository facts:** `package.json` starts
`react-router-serve ./build/server/index.js`; `@react-router/express@^8.3.0`
Node 22 Alpine, binds `0.0.0.0`, exposes port 3000, and starts the packaged
React Router server. The repository now also has an independent MCP entry and
declares the pinned v2 MCP packages.

The original combined mounting spike has been replaced by a standalone entry.
`scripts/remote-mcp-phase-0-server.ts` imports only the MCP module and Node HTTP;
it does not import React Router, the web build, static assets, sessions, or UI
routes. The web `start` command remains `react-router-serve`. The v2 recipe uses
`createMcpHandler(factory)` (fresh server per request) and `toNodeHandler`; the
standalone app deliberately does not install global body parsing. Authentication
and required transport-header checks run first, while the SDK owns parsing
authenticated request bodies.

The standalone public surface is exactly POST `/mcp`, GET
`/.well-known/oauth-protected-resource/mcp`, and GET `/health/live` and
`/health/ready`. Configuration is explicit: `MCP_PHASE_0_BEARER_TOKEN`,
`MCP_PHASE_0_PUBLIC_URL`, `MCP_PHASE_0_ISSUER_URL`, and host/origin allowlists
are required at startup. There is no token fallback. The process uses a
stateless modern handler, process-only liveness, deferred-DB readiness, and a
bounded drain controller for SIGTERM/SIGINT.

For this milestone, the standalone process contract is intentionally narrow:
`GET
/health/live` is an unauthenticated process-only liveness check and must not
depend on Auth0 or JWKS; `GET /health/ready` is an unauthenticated readiness
check for local configuration. Database connectivity/schema compatibility is
explicitly deferred because this spike has no DB dependency. Readiness returns
`503` during drain, new `/mcp` work is rejected, and accepted ordinary MCP HTTP
responses are tracked and given a bounded drain deadline. The prototype uses
JSON-only response mode; SSE is not enabled or tested yet. Auth0/JWKS failure
remains request-level fail-closed behavior, not a readiness failure. These are standalone results;
the former combined-server static-asset and React fallback observations are
not part of this process and must not be used as production topology evidence.

## Prototype gates and later-phase decisions

### Prototype gate results

1. **Passed:** the standalone app serves `phase_0_ping` over authenticated POST
   `/mcp`, with `Accept`, `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` (for
   the call), and the modern `_meta` envelope.
2. **Passed:** automated HTTP tests cover route isolation, unauthorized and
   cookie-only rejection, discovery metadata/challenges, successful discovery,
   tools/list and tools/call, origin/host mismatch, header/body mismatch,
   GET/DELETE rejection, no session header, health behavior, drain rejection,
    and fail-closed startup configuration. They also record the SDK's observed
    behavior for malformed JSON, content types, and Accept values: malformed JSON
    is rejected, while this SDK accepts omitted or unrelated Accept values in
    JSON response mode. The prototype deliberately selects `responseMode:
    "json"`; SSE and 202 notification behavior remain untested.
3. **Blocked by current CLI:** `npx -y @modelcontextprotocol/inspector@latest
   --cli --help` exposes no usable modern/protocol-version flag. With
   `--transport http`, it sent `2025-11-25` and received the expected typed 400
   unsupported-version response. No Inspector success is claimed.
4. **Passed:** the stub verifier accepts only the explicit spike bearer token,
   rejects cookies, and the test observer received SDK `AuthInfo` with client ID
   `phase-0-client`. No Auth0/JWT implementation was added.

Stop and resolve before adding finance or auth code if the pinned SDK cannot
produce the required modern wire behavior, if an independent MCP process
cannot expose the required health/readiness and graceful-drain behavior, or if
the proxy cannot reliably carry the required request/response forms.

### Later-phase gates

- **Auth0 gate:** in a disposable tenant, verify protected-resource metadata →
  Auth0 discovery → pre-registered public client with PKCE, then separately
  test CIMD and DCR; verify `resource` in authorization/token requests,
  audience/issuer/JWKS validation, scopes, refresh rotation, revocation limits,
  and exact callback handling. Record tenant evidence before Phase 2.
- **Client gate:** repeat Inspector plus Claude, VS Code, Cursor, and OpenAI
  tests against the same staging endpoint. Record actual request headers,
  selected protocol revision, registration path, OAuth callback, tool list,
  read call, insufficient-scope challenge, and reconnect behavior. A vendor
  documentation row must not be upgraded without this test.
- **Legacy gate:** do not implement legacy HTTP+SSE or sessionful Streamable
  HTTP merely because OpenAI or Cursor documents SSE. Add the deprecated
  compatibility package/routes only if a staging test demonstrates a required
  supported client cannot use modern Streamable HTTP. If needed, isolate it on
  separate routes and label it deprecated.
- **Finance gate:** only after transport and auth gates pass, proceed with the
  plan's actor-scoped service boundary, DTOs, ownership tests, and read-only
  tools. No bearer token or browser cookie may cross this boundary as an
  implicit identity.
- **Deployment gate:** run web and MCP as separate containers with independent
  secrets, limits, health/readiness checks, scaling, rollback, and proxy
  targets. Verify graceful drain of active request-scoped SSE and fault
  isolation. Both may use PostgreSQL, but exactly one release path owns schema
  changes; replace the current startup `drizzle-kit push --force` behavior with
  one release-only migration job using reviewed immutable migrations. Give web,
  MCP, and that job separate PostgreSQL roles: runtime roles have only required
  DML and no DDL, while the migration role is never available to containers.
  Use expand/migrate/contract compatibility and verify rollout/rollback order
  across both processes. The MCP container must never mutate schema at
  startup.
- **Shared-contract gate:** test the same actor-scoped finance commands,
  schemas, DTOs, authorization, and database boundary through both adapters.
  Keep React routes/loaders/actions, browser cookie sessions, UI code, and
  transport middleware process-specific; do not add an internal web-to-MCP
  HTTP hop initially.

## Authoritative sources checked

- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP 2026-07-28 authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)
- [MCP client registration](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration)
- [MCP versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [TypeScript SDK v2 serving/HTTP](https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html)
- [TypeScript SDK v2 Express](https://ts.sdk.modelcontextprotocol.io/v2/serving/express.html)
- [TypeScript SDK v2 legacy clients](https://ts.sdk.modelcontextprotocol.io/v2/serving/legacy-clients.html)
- [SDK npm packages: server](https://www.npmjs.com/package/@modelcontextprotocol/server), [node](https://www.npmjs.com/package/@modelcontextprotocol/node), [express](https://www.npmjs.com/package/@modelcontextprotocol/express)
- [MCP Inspector documentation](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector)
- [Claude remote MCP guide](https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers)
- [VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Cursor MCP documentation](https://cursor.com/docs/context/mcp)
- [OpenAI MCP documentation](https://platform.openai.com/docs/guides/tools-connectors-mcp)
- [Auth0 Auth for MCP](https://auth0.com/ai/docs/mcp/intro/overview)
- [Auth0 OIDC discovery](https://auth0.com/docs/get-started/applications/configure-applications-with-oidc-discovery)
- [Auth0 APIs](https://auth0.com/docs/get-started/apis)
- [Auth0 dynamic client registration](https://auth0.com/docs/get-started/applications/dynamic-client-registration)
- [Auth0 application settings](https://auth0.com/docs/get-started/applications/application-settings)

## Verification record

The links and npm metadata were checked on 2026-08-25. Exact runtime pins are
`@modelcontextprotocol/server@2.0.0`, `@modelcontextprotocol/node@2.0.0`,
`@modelcontextprotocol/express@2.0.0`, and `express@5.1.0`; the focused test
dependencies are exact `supertest@7.1.4`, `@types/supertest@6.0.3`, and
`@types/express@5.0.3`. The SDK's required Zod 4 remains nested under its
packages; the application's existing Zod 3 was not upgraded.

Commands and results:

- Focused MCP test file — **passed**, 9 tests, with an explicit 30-second
  command timeout.
- `npm test` — **passed**, 67 tests, with an explicit 120-second command
  timeout.
- `npm run typecheck` — **passed**.
- `npm run build` — **passed**.
- `npm run build:mcp` — **passed**, producing the dedicated bundled
  `build/mcp/server.js` artifact.
- Compiled-artifact smoke — **passed** locally: with explicit local
  configuration, the artifact served 200 for live/ready and protected-resource
  metadata, 401 with a metadata challenge for unauthenticated `/mcp`, and an
  authenticated modern `tools/call` returned `phase-0-ok`; `/` returned 404.
- `docker build -f Dockerfile.mcp .` and container probe — **not run in this
  environment** (Docker availability was not confirmed).
- Focused supertest/raw HTTP evidence — **passed** for the gates listed above;
  no `Mcp-Session-Id` is emitted by the stateless handler.
- Inspector CLI attempt — **not passed/blocked**, exactly as recorded above;
  SDK-client-equivalent behavior is covered by the focused HTTP tests instead.

No finance service, schema, Auth0 tenant, production `start` command, normal
production runtime, proxy, or infrastructure was changed. The standalone
process is locally buildable and runnable; deployment, proxy streaming, DB
connectivity/schema readiness, request-scoped SSE, and vendor-client
interoperability remain untested gates. The stub token is intentionally not
production authentication.
