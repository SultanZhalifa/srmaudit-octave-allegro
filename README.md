# SRMAudit 2026

An enterprise **GRC & security-audit platform** implementing the **OCTAVE Allegro**
risk-assessment methodology. TypeScript + Vite, no UI framework — a small, fast,
fully-typed SPA with a clean layered architecture.

- **Real data, always.** Cloud mode (Supabase auth + per-user RLS + storage) or a
  fully-functional local mode (IndexedDB). No mocks, no fake state.
- **Warm, minimal, accessible UI.** One accent colour, light/dark warm themes,
  zero emoji — every glyph is an inline SVG.
- **Strict quality gates.** Strict TypeScript, ESLint, Prettier, Vitest, CI.

## Quick start

```bash
npm install
cp .env.example .env      # optional: add Supabase keys for cloud mode
npm run dev               # http://localhost:5173
```

Without Supabase keys the app runs in **local mode** (real IndexedDB persistence).
To enable **cloud mode**, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
in `.env` and run `schema.sql` in your Supabase SQL editor. See [SETUP.md](SETUP.md).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `lint:fix` | ESLint (zero warnings allowed) |
| `npm run format` / `format:check` | Prettier |
| `npm run test` / `test:watch` / `test:coverage` | Vitest |
| `npm run verify` | typecheck + lint + test + build (the CI gate) |

## Architecture

A strict, one-way dependency flow keeps the codebase easy to reason about and test:

```
core  ←  data  ←  services  ←  features  ←  app
                     ↑            ↑
                     └──── ui ────┘
```

- **`src/core`** — domain types, config, constants/RBAC, utils, typed event bus.
- **`src/data`** — static reference data (OWASP catalogue, ISO/NIST mapping,
  knowledge base, risk bands) as typed modules.
- **`src/services`** — business logic. Pure engines (risk, compliance, exposure,
  findings) and I/O services (backend, repository, AI, PDF, preferences) behind
  a storage-adapter port (`SupabaseAdapter` | `LocalAdapter`).
- **`src/ui`** — framework-agnostic presentation: an XSS-safe `html` template,
  DOM/event-delegation helpers, the SVG icon set, and reusable components.
- **`src/features`** — one folder per page; each is a self-contained `Feature`.
- **`src/app`** — the shell: router (with RBAC), layout, login, bootstrap, theme.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full picture and
[docs/adr](docs/adr) for the key decisions.

## Security notes

- Only the Supabase **publishable/anon** key belongs in the client. Never put the
  `service_role` / `sb_secret_…` key in the front end or in `.env` here.
- All user-supplied text is escaped by the `html` tagged template by default;
  trusted markup opts in via `raw()`.
- The AI API key is the user's own and is stored only in their browser.
