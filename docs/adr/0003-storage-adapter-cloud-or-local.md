# 3. Storage adapter: cloud (Supabase) or local (IndexedDB)

Date: 2026-06-06

## Status

Accepted

## Context

The app must persist real data, work across devices when possible, but also run
fully offline / before any backend is configured — without ever resorting to mock
data. The original Supabase account was also lost, so the app could not assume a
working cloud at all times.

## Decision

Introduce a `StorageAdapter` **port** with two **adapters**:

- `SupabaseAdapter` — real auth, a per-user `app_data` table protected by RLS, and
  evidence files in Storage. Loaded lazily so the SDK is excluded from the bundle
  in local-only deployments.
- `LocalAdapter` — a real local identity store (SHA-256 hashed passwords) and
  IndexedDB persistence with per-user key namespacing and Blob file storage.

`Backend` selects the adapter at runtime from `config.cloudConfigured`. The
`Repository` and all features depend only on the port, never the concrete adapter.

## Consequences

- The app is genuinely functional in both modes with identical feature code.
- Switching to cloud is a config change (`.env`) + running `schema.sql`; no code
  changes.
- The adapter boundary is a natural unit-test seam (`LocalAdapter` is tested with
  `fake-indexeddb`).
- Local data is per-browser; cross-device sync requires cloud mode (a documented
  trade-off).
