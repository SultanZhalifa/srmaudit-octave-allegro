# Architecture

SRMAudit is a layered, framework-free TypeScript SPA. The guiding principle is a
**one-way dependency flow** so that lower layers never import higher ones. This
keeps the graph acyclic, makes the pure logic trivially testable, and lets the
storage backend swap without touching features.

```
┌─────────┐   ┌──────────┐   ┌────────────┐   ┌────────────┐   ┌───────┐
│  core   │ ← │   data   │ ← │  services  │ ← │  features  │ ← │  app  │
└─────────┘   └──────────┘   └────────────┘   └────────────┘   └───────┘
                                    ↑                ↑
                                    └──────  ui  ────┘
```

## Layers

### `src/core` — foundation
No dependencies on any other layer.
- `types.ts` — every domain model (the single source of truth).
- `constants.ts` — workspace keys, page registry, RBAC matrix + `canAccess`/`canEdit`.
- `config.ts` — environment-sourced configuration (`import.meta.env`).
- `events.ts` — a typed pub/sub bus (`toast`, `navigate`, `data-changed`, …).
- `utils.ts` — `escapeHtml`, `debounce`, `sha256`, `withTimeout`, etc.

### `src/data` — reference data
Static, typed catalogues: the OWASP vulnerability list, ISO 27001 / NIST CSF
mapping, the AI knowledge base, OCTAVE impact areas & container types, and the
risk-severity bands. Pure data + tiny lookup helpers.

### `src/services` — business logic & I/O
- **Engines** (`services/engines/*`) — *pure functions*: `risk-engine`,
  `compliance-engine`, `exposure-engine`, `findings-engine`. These hold the
  OCTAVE math and carry the unit tests.
- **Storage** (`services/storage/*`) — the **ports & adapters** boundary. The
  `StorageAdapter` interface is implemented by `LocalAdapter` (IndexedDB) and
  `SupabaseAdapter` (cloud). The adapter is chosen at runtime from config.
- **`backend.ts`** — the session/identity facade. Picks the adapter, manages the
  authenticated user, and exposes a `Repository` bound to that user.
- **`repository.ts`** — typed, cached workspace data with write-through +
  debounced persistence. Features only ever talk to the repository.
- **`ai-service.ts`** — real provider calls (Gemini/OpenRouter, auto-detected) or
  the knowledge-base fallback. **`pdf-service.ts`** — jsPDF report generation.
- **`preferences.ts`** — device-local prefs (theme, AI key) in localStorage.

### `src/ui` — presentation primitives
Framework-agnostic and feature-agnostic.
- `html.ts` — an **XSS-safe tagged template**. Interpolations are escaped by
  default; trusted markup uses `raw()`. This is the core safety guarantee.
- `dom.ts` — event delegation (`data-action` / `data-input` / `data-change`)
  instead of global `onclick`, plus typed element getters.
- `icons.ts` — the inline SVG icon set with an `IconName` union.
- `components.ts`, `modal.ts`, `toast.ts`, `chart.ts` — reusable building blocks.

### `src/features` — pages
Each page implements the `Feature` interface (`render()` + optional `onMount()`).
A feature is self-contained: it renders markup from `ui` components and registers
its own delegated action handlers once. Features never import each other.

### `src/app` — the shell
- `router.ts` — maps `PageId` → `Feature`, enforces RBAC, renders into the main
  region, animates counters, and applies view-only mode for restricted roles.
- `layout.ts` / `login.ts` — the sidebar/topbar shell and the auth screen.
- `actions.ts` — cross-cutting handlers (auth, nav, theme, import/export).
- `bootstrap.ts` / `theme.ts` — startup wiring and theme management.

## Key flows

**Sign-in → workspace**: `actions.signIn` → `backend.signIn` → adapter authenticates
→ `Repository.hydrate()` loads the user's rows → `mountApp` renders the shell →
`router.navigateTo('dashboard')`.

**Editing data**: a feature calls `repo().set(key, value)` → the cache updates
instantly and a `data-changed` event fires → persistence is debounced (400ms) and
retried with backoff → `sync-updated` refreshes the indicator.

**Rendering**: `router` calls `feature.render()` (pure, returns safe `html`),
injects it, then calls `feature.onMount()` for side effects (e.g. charts).

## Testing strategy

The pure engines and the `html` safety layer carry the bulk of the tests
(`tests/*.test.ts`, run with Vitest + jsdom + fake-indexeddb). Because business
logic is isolated from the DOM, it is tested directly without rendering.

## Adding a feature

1. Create `src/features/<name>/<name>.ts` exporting a `Feature`.
2. Build the view from `ui/components`; register handlers with `onAction` once.
3. Register it in `app/router.ts` and add an entry to `PAGES` + a `NAV_GROUPS`
   slot and (if needed) the `ROLE_PERMISSIONS` matrix in `core/constants.ts`.
