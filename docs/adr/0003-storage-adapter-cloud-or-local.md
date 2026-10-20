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
- `LocalAdapter` — a real local identity store (passwords hashed, see the update below) and
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

## Update (October 2026): how local passwords are hashed

The first version stored `sha256(password)` with no salt. That is fast to brute-force,
and two accounts with the same password had the same hash. New accounts now store a
random 16-byte salt and a PBKDF2-HMAC-SHA256 hash at 600,000 iterations (WebCrypto, no
new dependency); the algorithm, salt and iteration count are stored with the account.

Accounts created earlier still sign in. On a successful sign-in, the only moment the
password is available, their record is rewritten with a salted hash. An account whose
stored iteration count is lower than the current one is re-hashed the same way.

What this does not change: a local account only guards the workspace in this browser.
The workspace data in IndexedDB is not encrypted, and anyone who can open this
browser profile can read it without a password. PBKDF2 makes a stolen copy of the
`accounts` store much harder to crack. It is not a substitute for cloud mode.
