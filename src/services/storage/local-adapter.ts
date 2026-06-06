/**
 * Local storage adapter — a real, fully-functional offline workspace backed by
 * IndexedDB, with a local identity store (passwords hashed with SHA-256). Used
 * when no Supabase credentials are configured. Not a mock: data durably persists.
 */
import type { AuthUser, Role } from '@/core/types';
import { sha256 } from '@/core/utils';
import { idb } from './indexeddb';
import type { SignUpResult, StorageAdapter, UploadedFile } from './storage-adapter';

const SESSION_KEY = 'srm_localSession';

interface StoredAccount {
  hash: string;
  profile: AuthUser;
}

export class LocalAdapter implements StorageAdapter {
  readonly mode = 'local' as const;

  async restoreSession(): Promise<AuthUser | null> {
    const email = localStorage.getItem(SESSION_KEY);
    if (!email) return null;
    const account = await idb.get<StoredAccount>('accounts', email);
    return account?.profile ?? null;
  }

  async signUp(email: string, password: string, name: string, role: Role): Promise<SignUpResult> {
    const existing = await idb.get<StoredAccount>('accounts', email);
    if (existing) throw new Error('An account with this email already exists');
    const id = 'local-' + (await sha256(email)).slice(0, 16);
    const profile: AuthUser = { id, email, name: name || email.split('@')[0] || email, role };
    await idb.set('accounts', email, { hash: await sha256(password), profile });
    localStorage.setItem(SESSION_KEY, email);
    return { ok: true, user: profile };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const account = await idb.get<StoredAccount>('accounts', email);
    if (!account) throw new Error('No account found for this email. Please sign up first.');
    if (account.hash !== (await sha256(password))) throw new Error('Incorrect password');
    localStorage.setItem(SESSION_KEY, email);
    return account.profile;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }

  resetPassword(): Promise<void> {
    return Promise.reject(
      new Error('Password reset requires cloud mode. Configure Supabase in your environment.'),
    );
  }

  async loadAll(userId: string): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    const keys = await idb.keys('kv');
    const prefix = userId + ':';
    for (const k of keys) {
      if (typeof k === 'string' && k.startsWith(prefix)) {
        result[k.slice(prefix.length)] = await idb.get('kv', k);
      }
    }
    return result;
  }

  async save(userId: string, key: string, value: unknown): Promise<void> {
    await idb.set('kv', `${userId}:${key}`, value);
  }

  async remove(userId: string, key: string): Promise<void> {
    await idb.del('kv', `${userId}:${key}`);
  }

  async uploadFile(userId: string, file: File): Promise<UploadedFile> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}_${safe}`;
    await idb.set('files', path, file);
    return { url: URL.createObjectURL(file), path, stored: 'local' };
  }

  async deleteFile(path: string): Promise<void> {
    await idb.del('files', path);
  }
}
