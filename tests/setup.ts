/** Vitest global setup: provide IndexedDB + WebCrypto + localStorage in the jsdom environment. */
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

/**
 * Node 25+ ships its own experimental `localStorage` global. Without the
 * --localstorage-file flag it is undefined, and it shadows the one jsdom would
 * provide, so any test that touches localStorage fails on newer Node versions.
 * Install a small in-memory Storage only when the real one is missing; on Node 20
 * and 22 jsdom's own localStorage is used and this does nothing.
 */
if (typeof globalThis.localStorage?.clear !== 'function') {
  const items = new Map<string, string>();
  const storage = {
    get length() {
      return items.size;
    },
    key: (index: number) => [...items.keys()][index] ?? null,
    getItem: (key: string) => items.get(String(key)) ?? null,
    setItem: (key: string, value: string) => void items.set(String(key), String(value)),
    removeItem: (key: string) => void items.delete(String(key)),
    clear: () => items.clear(),
  } satisfies Storage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}
