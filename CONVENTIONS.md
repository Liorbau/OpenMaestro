# Engineering Conventions (Lior's preferences)

**Read this before writing any code in this repo. Acknowledge it at the start of the
coding phase.**

> Applicability note for OpenMaestro: this is a **browser-only TypeScript app with no
> backend** (by design — see CLAUDE.md). The general TS rules below apply everywhere
> (curly braces, no `any`, explicit return types, `type` over `interface`, async/await,
> single source of truth, guard stale async, fail visibly, typed arrays + `.map()`, etc.).
> The **backend/layering rules** (module → controller → service → DAO → DB, auth guards,
> bcrypt, DTOs, error envelope) apply **only if** we build the optional bonus leaderboard
> server. Keep them on file for that case; don't force them onto client code.

## Shared Engineering Principles
1. Always use curly braces for every `if` statement, including one-liners.
2. Remove pass-through handlers; call the original function directly when no
   extra logic is added.
3. Never fail validation silently; always return or show a clear error.
4. Keep validation behavior consistent across similar flows.
5. Prefer clear variable names (`inputValue`, `value`) over vague names.
6. Derive critical values from latest state in functional updates when relevant.
7. Use typed arrays + `.map()` for repeated options or repeated UI/logic branches.
8. Add edge-case tests for mutation paths (e.g. non-existent IDs).
9. Keep formatting conventions strict (EOF newline, lint and format clean).
10. Use `type` aliases for object/data shapes instead of `interface`.
11. Keep a single source of truth for shared state.
12. Guard against stale async results before writing state.
13. Keep leaf/presentational components decoupled from infra concerns.
14. Do not silently substitute fallback values that mask bugs; fail visibly.
15. Keep clear layering (e.g. module -> controller -> service -> DAO -> DB).
16. Keep transport/framework types at the edges (controllers, guards, pipes).
    Services and DAOs stay framework-agnostic.
17. Use one consistent error envelope shape across the app.
18. Use async/await consistently; do not mix callback style in new code.
19. Validate inputs before business logic (DTOs + a global validation layer).
20. Logging should include enough context (method, path, status, duration, key
    IDs when relevant).
21. Never store or log secrets or plaintext passwords; hash with bcrypt and load
    secrets from env only.
22. No `any`; declare explicit return types on every function and method.
23. Never introduce a `Promise<void>` (or any void-returning function) on a
    guess. When a function would naturally return nothing, pause and ask what it
    should do.
24. Keep each function/class/method at a single level of abstraction. If a unit
    otherwise only orchestrates named helpers and then contains one inline
    ad-hoc block, extract that block into a peer helper at the same level.

## Naming and Commit Conventions
- One logical concern per commit; do not combine unrelated areas.
- Message format: `<file/topic>: <message>` — lowercase verb, <= 72 chars, end
  with a period (e.g. `users: back users with a unique email index.`).
  New files/modules: `<topic>: initial commit.`
- Branch: `feature/<domain>/<scope>`, kebab-case (e.g. `feature/backend/db`).
- Run typecheck, lint, and tests before pushing.
- Order commits so code is in its final shape by the time it lands. Reviewers
  read chronologically, so don't let an early commit introduce code a later
  commit in the same PR rewrites. When squashing/reordering, fold the fix into
  the commit that introduces the code so intermediate states never show
  superseded logic.

## Backend Architecture and Clean Code
### Layering and responsibilities
- **Module** declares controllers/providers and wires imports/exports; consume
  another module's provider only when it is exported.
- **Controller** is the only layer touching request/response: read the validated
  input and the current user, call a service, return a DTO. No business logic.
- **Service** owns business logic/orchestration; framework- and DB-agnostic.
- **DAO / repository** owns persistence; services never touch the ORM/driver
  directly.
- **Guard / Strategy / Decorator** own authentication and identity extraction.
- Inject dependencies via constructors; never `new` providers manually.
### Auth and authorization
- Auth guard on every protected route; missing/invalid token -> `401`.
- Resource-ownership rule: act only on resources you belong to, else `403`
  (never leak data or fall back to `404`).
- Derive identity from the verified token, never from the request body.
### Error handling
- One envelope `{ error: { code, message, details? } }` via a central exception
  filter. Map: auth -> `401`, authorization -> `403`, duplicate -> `409`,
  validation -> `400`.
### Config, secrets, validation
- Centralized config; required secrets loaded from env. Commit `.env.example`,
  never a real `.env`.
- Hash passwords with bcrypt (rounds 10-12); compare with `bcrypt.compare`;
  never return/log the hash.
- Validate with a schema/validator + a global validation layer (whitelist,
  forbid unknown fields). Use two-sided bounds only when both matter; avoid
  unnecessary bounds.

## Good Habits
- Clear layering; framework types only at the edges; consistent naming across
  layers.
- Single source of truth for validation and error shapes; preserve the error
  envelope so the frontend contract holds.
- Derive UI labels from runtime API data, not hardcoded lookup tables.
- One scenario per test; add edge-case tests for mutation paths.
- async/await consistently; correct status codes and REST semantics; log with
  context.
- Keep DAOs injectable; keep static error factories for readable errors.
- Run typecheck + lint before pushing; keep README setup/run steps current.

## Code Smells to Avoid
- Fat controllers with business logic; passing request/response objects into
  services or DAOs.
- Inconsistent JSON/error shapes; wrong status codes; trusting the request body
  without validation.
- Plaintext passwords stored/returned/logged; hardcoded secrets or a committed
  `.env`.
- Unprotected routes; authorization failures returning data or `404` instead of
  `403`; identity taken from the body.
- Manually instantiating providers; DTOs that skip validation or accept unknown
  fields.
- Changing the error envelope and breaking the frontend contract; ignoring
  lint/typecheck.
