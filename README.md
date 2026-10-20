# SRMAudit 2026

A web tool for running an **OCTAVE Allegro** style risk assessment and a security audit
checklist for one organisation, step by step, and exporting the result as a PDF report.
It was built as a Security Risk Management mini project. TypeScript and Vite, no UI
framework.

It follows OCTAVE Allegro's idea of starting from the information assets, but it is not
the full method: see [Limits](#limits) below.

- **Two ways to store data.** In local mode, accounts and data stay in this browser
  (IndexedDB). In cloud mode they live in your own Supabase project, with row-level
  security so each user only reaches their own rows. The pages work the same in both.
- **Checked on every push.** Strict TypeScript, ESLint with zero warnings, Prettier,
  Vitest and a production build run in CI.
- **One accent colour, light and dark themes, no emoji** (every icon is an inline SVG).

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

## Limits

Things this tool does not do, so nobody has to find out the hard way:

- **A fixed catalogue.** Risks are picked from 19 web application vulnerabilities in 8
  categories, not built from free-form threat scenarios. Likelihood and impact start from a
  default for each vulnerability and can be changed per risk in the register.
- **Step 1 is notes.** The risk measurement criteria are saved with the workspace as a
  reference text, and shown above the risk register while you rate. They do not change any
  score and nothing suggests a rating from them.
- **Roles change the interface, not the database.** Admin, auditor and auditee decide
  which pages are shown and editable. Users are separated by sign-in, not by role.
- **One private workspace per account.** One assessment can't be shared between accounts.
  The Users page is a list inside a workspace.
- **Local mode is a convenience lock.** The data in IndexedDB is not encrypted, and
  clearing the site's data deletes it.
- **The assistant is small unless you give it a key.** Without a key it answers from a
  built-in knowledge base. With a Gemini or OpenRouter key, your questions are sent to that
  provider from the browser.

## Security notes

- Only the Supabase **publishable/anon** key belongs in the client. Never put the
  `service_role` / `sb_secret_…` key in the front end or in `.env` here.
- All user-supplied text is escaped by the `html` tagged template by default;
  trusted markup opts in via `raw()`.
- The AI API key is the user's own and is stored only in their browser.
- In local mode, passwords are stored as PBKDF2-SHA256 hashes with a per-account salt
  (older accounts are upgraded the next time they sign in). A local account only guards
  the workspace in this browser; the data in IndexedDB is not encrypted. See
  [ADR 3](docs/adr/0003-storage-adapter-cloud-or-local.md).
- Evidence files sit in a **private** Supabase bucket. Row-level policies only let a
  user reach the folder named after their own id, and the app opens files through
  signed links that expire after an hour. Upgrading an older project? See the note
  in [SETUP.md](SETUP.md) (step 6): don't re-run `schema.sql`, run one `update` instead.
