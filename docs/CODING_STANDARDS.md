# Sanctuary Coding Standards

This document defines the target standard for all new and changed Sanctuary code. Existing code that violates a rule is migration debt, not precedent. Keep focused changes focused, but do not reproduce an outdated pattern merely because it already exists.

Sanctuary uses TypeScript in strict mode, React 19, and React Router 8 in framework mode with server-side rendering. The words **must**, **should**, and **may** indicate requirements, defaults, and optional practices.

## Core Principles

- Prefer the smallest complete solution over speculative abstractions.
- Preserve end-to-end type information instead of asserting that values are safe.
- Treat the URL, request, and server as the source of truth for server state.
- Keep route modules focused on HTTP and UI orchestration; keep business rules and persistence outside components.
- Validate untrusted values at runtime even when their TypeScript types appear correct.
- Cover changed behavior with focused tests and avoid unrelated refactors or formatting churn.

## TypeScript

### Type Safety

- Code must pass `npm run typecheck` under the repository's strict TypeScript configuration.
- Do not introduce `any`. Use `unknown` at untyped boundaries and narrow it with a schema, type guard, or control flow.
- Do not use `@ts-ignore`, broad type assertions, or non-null assertions to conceal a modeling problem. A narrow assertion is acceptable only when an invariant cannot be expressed to TypeScript and is explained locally.
- Prefer inference for implementation details. Add explicit types to exported domain APIs and boundaries where they clarify or stabilize the contract.
- Do not manually duplicate a type already available from a function, schema, generated route type, or Drizzle model. Derive it with `typeof`, `Awaited`, indexed access, `z.infer`, or the library's inference helper.
- Use `satisfies` when validating an object against a contract while preserving its narrower inferred type.
- Keep unions discriminated. Model success and failure, loading states, and mutually exclusive UI states as literal unions rather than bags of optional properties and booleans.
- Make switches over closed unions exhaustive. An unreachable `never` check is appropriate when it protects future additions.
- Catch values are `unknown`; inspect with `instanceof Error`, a library predicate, or a custom guard before reading properties.

### Domain Modeling

- Use domain names rather than transport names: `expense`, `paySchedule`, and `budgetMember`, not generic `data`, `item`, or `record`.
- Use `null` for an intentional empty domain or database value. Use `undefined` for omission or an optional argument. Do not alternate between them for the same concept.
- Prefer string literal unions and `as const` mappings over TypeScript `enum`.
- Use branded or validated values at boundaries when primitive confusion would be costly, but do not wrap every primitive without a concrete benefit.
- Store and calculate fractional currency as integer cents. Keep date-only values distinct from instants and make timezone conversion explicit.
- Prefer immutable inputs and return values. Do not mutate arguments or loader data.

### Functions And Modules

- A function should have one clear level of abstraction. Prefer guard clauses to deeply nested control flow.
- Prefer an options object when a function takes multiple values of the same type, several optional values, or arguments whose order is not self-evident.
- Return typed domain results for expected failures. Throw only for redirects, response failures, or unexpected conditions that an error boundary should handle.
- Do not add a helper used once unless it gives a complex rule a meaningful boundary. Keep closely related logic together.
- Use `import type` for type-only imports. Use the `~/*` alias across application directories and relative imports within the same local module.
- Avoid barrel files that hide dependencies, create cycles, or pull server code toward the client bundle.
- Components and types use `PascalCase`; functions and variables use `camelCase`; hooks begin with `use`. Component files use `PascalCase.tsx`, services use `DomainService.ts`, and tests use `*.test.ts`.

## React 19

### Components And State

- Use function components. Render must remain pure: no mutation, network calls, storage access, or other side effects during render.
- Keep state minimal. Derive values during render instead of synchronizing one state variable from another with an effect.
- Prefer server state from route loaders and actions over copying it into component state. Local state is for transient interaction, drafts, and optimistic UI.
- Keep state close to the components that use it. Lift it only when multiple branches need one authoritative value.
- Use stable domain keys for lists. Do not use an array index when items may be inserted, removed, filtered, or reordered.
- Prefer composition and focused components over large components controlled by many boolean mode props.
- Use controlled inputs when the UI must react to each change; otherwise allow native forms and uncontrolled inputs to do less work.

### Effects And Performance

- Effects synchronize React with an external system. Do not use an effect for derivation, event handling, or work that belongs in a loader or action.
- Every effect must have complete dependencies and correct cleanup. Do not suppress dependency rules to force a desired schedule.
- Use `useEffectEvent` for non-reactive effect logic that needs current props or state without causing the effect to resubscribe.
- Use `startTransition` for non-urgent client updates that may suspend or render substantial work. Use `useDeferredValue` when a slow view may lag behind rapidly changing input.
- Do not add `useMemo`, `useCallback`, or `memo` by default. Add manual memoization only for measured expensive work or when stable identity is required by an external API.
- Preserve user input and focus across pending states. Disable only controls whose repeated use would be invalid.

### Accessibility

- Use native semantic controls instead of clickable non-interactive elements. Every control must have an accessible name and visible keyboard focus.
- Associate validation messages with their fields. Use appropriate `status`, `alert`, and live-region semantics for asynchronous feedback.
- Icon-only controls require an accessible name; decorative icons must be hidden from assistive technology.
- Changed UI must work with keyboard navigation, mobile and desktop widths, and the relevant light and dark themes.

## React Router 8

### Route Modules And Types

- Register routes in `app/routes.ts`. Keep URL structure stable and organize route files by domain under `app/routes/**`.
- Every route module must import its generated type namespace from `./+types/<route-name>` and use the relevant generated types:

```tsx
import type { Route } from "./+types/expenses";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return loadExpenses(request, params);
}

export async function action({ request, params }: Route.ActionArgs) {
  return updateExpense(request, params);
}

export default function Expenses({ loaderData, actionData }: Route.ComponentProps) {
  return <ExpensesPage expenses={loaderData.expenses} result={actionData} />;
}
```

- Do not hand-write `{ request: Request }`, route parameter types, loader-data types, or component-prop types when generated `Route` types provide them.
- Let loader and action return types infer from their implementations so `Route.ComponentProps` receives the precise data type. Avoid annotations that widen literal discriminants or erase response detail.
- Access-control wrappers must preserve the generated loader/action contract and use a real authenticated-user type. Middleware callbacks must not expose `any`.
- Do not edit `.react-router/` output or generated `+types` files. Run `npm run typecheck` to regenerate route types.
- Use `handle`, `headers`, `links`, `meta`, `shouldRevalidate`, and route error boundaries only for their framework-defined purpose. Keep route-specific behavior in the route that owns it.

### Loaders And Server Boundaries

- Loaders read server state and must not cause business mutations. Actions perform mutations.
- Every non-public loader and action must enforce access with `pageAccessLoader`, `pageAccessAction`, `adminOnlyLoader`, `adminOnlyAction`, or an equally explicit authentication boundary.
- Authorization is required at both route and resource levels. Every query for user-owned data must be scoped by the authenticated `userId`; shared resources must validate membership and role.
- Treat params, search params, headers, cookies, and form data as untrusted strings. Parse and validate them before calling domain logic.
- Put database access, authorization rules, integrations, and business workflows in `app/modules/services/**`. Route modules translate requests and responses; components never access the database.
- Keep server-only modules in server-oriented paths or use a `.server.ts` suffix where a boundary is otherwise ambiguous. Never import secrets, database clients, filesystem code, or Node-only APIs into client components.
- Pass `request.signal` to cancellable downstream fetches. A superseded navigation should not leave avoidable work running.
- Return only data needed by the client. Do not serialize secrets, credentials, password hashes, tokens, raw provider responses, or rich class instances.
- Run independent loader work concurrently with `Promise.all`; keep dependent work sequential. Avoid route-level request waterfalls when parent data or parallel loading can satisfy the need.

### Actions And Forms

- Prefer `<Form>` for navigations and `fetcher.Form` for mutations that should not navigate. Prefer router primitives over manual `fetch` when they provide the required behavior.
- Use the platform request format: `FormData` for form submissions and `URLSearchParams` for URL state. Validate once, normalize once, then pass typed values to the service layer.
- Use a literal `intent` field when one action supports several operations. Validate it as a discriminated union and handle it exhaustively.
- Return a consistent discriminated result within a domain, for example:

```ts
type SaveResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```

- Expected validation failures should return user-safe field and form errors, not throw. Redirect after a successful mutation when the URL should change; otherwise return the updated result and let React Router revalidate relevant data.
- Do not trust client-provided ownership, identity, permissions, totals, or calculated values. Derive authoritative values on the server.
- Use transactions when multiple writes form one logical mutation.

### Navigation, Pending UI, And URL State

- Use `useNavigation` for global navigation state and `useFetcher` for independent interactions. Do not create parallel global loading state for work already tracked by the router.
- Scope pending UI to the submission being processed by checking navigation or fetcher state and submitted form data where necessary.
- Prefer optimistic UI only when the update is reversible and the expected result is deterministic. Reconcile with action and revalidation data rather than treating the optimistic value as authoritative.
- Put shareable and reload-persistent state in path segments or search parameters. Keep ephemeral presentation state local.
- Use `Link` and `NavLink` for internal navigation. Build dynamic paths with router-safe helpers rather than ad hoc string concatenation.
- Let React Router manage race conditions and revalidation. Do not add request timestamps or duplicate stale-response machinery unless a demonstrated case falls outside router behavior.
- Override `shouldRevalidate` sparingly. The default protects correctness; an optimization must show why skipped data cannot have changed.

### Errors And Responses

- Add a route `ErrorBoundary` where the route can provide useful recovery or context. Use `Route.ErrorBoundaryProps` and `isRouteErrorResponse` to distinguish response errors from unexpected exceptions.
- Throw redirects and deliberate HTTP response failures when control should leave normal rendering. Return typed action results for expected user-correctable failures.
- Do not expose stack traces, SQL, tokens, or internal provider details outside development.
- Preserve meaningful HTTP status codes and headers. Do not collapse all failures into a successful `200` response with an error string.
- Root error handling must remain a final fallback; do not swallow unexpected errors and silently render empty authenticated state.

## Testing And Completion

- Tests use `node:test` and `node:assert/strict`, colocated as `*.test.ts`.
- Test observable behavior and type-safe domain boundaries: success, validation failures, authorization, ownership, boundary values, and regression cases.
- Prefer pure tests for parsers and domain logic. Service tests must isolate external systems and never use production data.
- Before completing a change, run `npm test` and `npm run typecheck`.
- Run `npm run build` after changes to routes, server/client boundaries, dependencies, framework configuration, or deployment behavior.
- For UI changes, exercise the affected flow at mobile and desktop widths with keyboard interaction and relevant dark-mode states. Use `skills/sanctuary-local-testing/SKILL.md` for the local environment.
- Review the final diff for `any`, unsafe assertions, duplicated types, unvalidated request data, access-control gaps, leaked server imports, unrelated churn, generated files, debug output, and secrets.

CI runs type checking and tests on pushes to `main`. Formatting, linting, browser behavior, accessibility, and migration safety still require review because they are not currently CI gates.
