# 2. TypeScript + Vite layered SPA, no UI framework

Date: 2026-06-06

## Status

Accepted

## Context

The original app was plain `<script>` files sharing globals (`App`, `Modules`),
HTML built via template strings with `onclick="App.x()"`, and no build step,
types, tests, or modules. This made refactoring risky and onboarding slow.

We considered: (a) staying vanilla but modular, (b) adopting a framework
(React/Vue), or (c) TypeScript + Vite keeping a thin, framework-free runtime.

## Decision

Adopt **TypeScript + Vite** with a **layered architecture** (`core / data /
services / ui / features / app`) and **no UI framework**.

- TypeScript (strict) gives compile-time safety across a shared domain model.
- Vite gives a fast dev server, code-splitting, and env-var injection.
- Avoiding a framework keeps the bundle small and the mental model simple; the
  app's interactivity is modest (forms, tables, charts, a modal).
- A custom **XSS-safe `html` tagged template** replaces raw string concatenation,
  and **event delegation** (`data-action`) replaces global `onclick`.

## Consequences

- A Node toolchain and `npm run build` are now required (was: open the file).
- Strong typing + pure engines make the core logic unit-testable and refactors
  safe. Quality gates (typecheck, lint, test, build) run in CI.
- Contributors must learn the layer boundaries (documented in ARCHITECTURE.md),
  but gain a predictable, acyclic dependency graph.
