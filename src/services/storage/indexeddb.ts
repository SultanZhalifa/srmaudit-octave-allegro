/** Minimal promise-based IndexedDB wrapper used by the local storage adapter. */

const DB_NAME = 'srmaudit_db';
const DB_VERSION = 1;
export type StoreName = 'kv' | 'accounts' | 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts');
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = run(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idb = {
  get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return tx<T | undefined>(store, 'readonly', (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  set(store: StoreName, key: string, value: unknown): Promise<IDBValidKey> {
    return tx(store, 'readwrite', (s) => s.put(value, key));
  },
  del(store: StoreName, key: string): Promise<undefined> {
    return tx(store, 'readwrite', (s) => s.delete(key) as IDBRequest<undefined>);
  },
  keys(store: StoreName): Promise<IDBValidKey[]> {
    return tx(store, 'readonly', (s) => s.getAllKeys());
  },
};
