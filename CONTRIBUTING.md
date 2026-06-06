# Contributing

Thanks for working on SRMAudit. This guide keeps the codebase consistent and the
quality gates green.

## Setup

```bash
npm install
cp .env.example .env   # optional Supabase keys; empty = local mode
npm run dev
```

## Before you push

Run the full gate locally — CI runs the same thing:

```bash
npm run verify   # typecheck + lint + test + build
```

Individually: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run format`.

## Conventions

- **Layers are one-way.** `core → data → services → features → app`, with `ui`
  available to `services`/`features`. Never import "upward". See
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **No raw HTML strings in the DOM.** Build markup with the `html` tagged template
  (`src/ui/html.ts`); it escapes interpolations. Use `raw()` only for trusted,
  already-built markup (icons, nested components).
- **No inline `onclick`.** Use `data-action` / `data-input` / `data-change`
  attributes and register handlers with `onAction` / `onInput` / `onChange`.
- **No emoji.** Add a new SVG to `src/ui/icons.ts` and reference it by name.
- **Keep business logic in pure engines** (`src/services/engines`) so it stays
  unit-testable. Add a test for any new calculation.
- **Types first.** Extend `src/core/types.ts` rather than using `any`.
- **Secrets** live in `.env` (gitignored). Only the Supabase anon key may reach
  the client; never the service-role key.

## Adding a page (feature)

1. `src/features/<name>/<name>.ts` exporting a `Feature` (`render()` +
   optional `onMount()`).
2. Register it in `src/app/router.ts`, and add it to `PAGES`, `NAV_GROUPS`, and
   the `ROLE_PERMISSIONS` matrix in `src/core/constants.ts`.

## Architecture decisions

Record significant decisions as an ADR in `docs/adr` (copy the format of an
existing one).
