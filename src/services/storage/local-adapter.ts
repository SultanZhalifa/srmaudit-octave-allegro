/**
 * Local storage adapter — a real, fully-functional offline workspace backed by
 * IndexedDB, with a local identity store (passwords hashed with a per-account salt
 * and PBKDF2-SHA256). Used when no Supabase credentials are configured. Not a mock:
 * data durably persists. The account only guards the workspace in this browser;
 * the data itself is not encrypted.
 */
import type { AuthUser, Role } from '@/core/types';
import { constantTimeEqual, pbkdf2Hex, randomHex, sha256 } from '@/core/utils';
import { idb } from './indexeddb';
import type { SignUpResult, StorageAdapter, UploadedFile } from './storage-adapter';

const SESSION_KEY = 'srm_localSession';

/** Work factor for new hashes (OWASP's figure for PBKDF2-HMAC-SHA256). Stored per account, so it can be raised later. */
export const PASSWORD_ITERATIONS = 600_000;
const KDF = 'pbkdf2-sha256';

interface StoredAccount {
  hash: string;
  profile: AuthUser;
  /** Present on accounts hashed with {@link KDF}. Older accounts have a plain, unsalted SHA-256 `hash`. */
  kdf?: typeof KDF;
  salt?: string;
  iterations?: number;
}

/** A fresh salt and hash for `password`. */
async function newCredential(
  password: string,
): Promise<Pick<StoredAccount, 'hash' | 'kdf' | 'salt' | 'iterations'>> {
  const salt = randomHex(16);
  return {
    hash: await pbkdf2Hex(password, salt, PASSWORD_ITERATIONS),
    kdf: KDF,
    salt,
    iterations: PASSWORD_ITERATIONS,
  };
}

/** Object URLs already made for stored files, so one file doesn't get a new URL on every render. */
const objectUrls = new Map<string, string>();

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
    await idb.set('accounts', email, { ...(await newCredential(password)), profile });
    localStorage.setItem(SESSION_KEY, email);
    return { ok: true, user: profile };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const account = await idb.get<StoredAccount>('accounts', email);
    if (!account) throw new Error('No account found for this email. Please sign up first.');
    if (!(await this.checkPassword(email, account, password)))
      throw new Error('Incorrect password');
    localStorage.setItem(SESSION_KEY, email);
    return account.profile;
  }

  /**
   * Compare `password` with the stored hash. An account created before salting was
   * added has a plain SHA-256 hash: it still signs in, and is moved to a salted hash
   * on that successful sign-in, the only moment the password is available.
   */
  private async checkPassword(
    email: string,
    account: StoredAccount,
    password: string,
  ): Promise<boolean> {
    if (account.kdf === KDF && account.salt) {
      const iterations = account.iterations ?? PASSWORD_ITERATIONS;
      const matches = constantTimeEqual(
        await pbkdf2Hex(password, account.salt, iterations),
        account.hash,
      );
      if (matches && iterations < PASSWORD_ITERATIONS) {
        await idb.set('accounts', email, { ...account, ...(await newCredential(password)) });
      }
      return matches;
    }
    if (!constantTimeEqual(await sha256(password), account.hash)) return false;
    await idb.set('accounts', email, { ...account, ...(await newCredential(password)) });
    return true;
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
    return { path, stored: 'local' };
  }

  async deleteFile(path: string): Promise<void> {
    await idb.del('files', path);
    const url = objectUrls.get(path);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.delete(path);
    }
  }

  async getFileUrls(paths: string[]): Promise<Record<string, string>> {
    const urls: Record<string, string> = {};
    for (const path of paths) {
      let url = objectUrls.get(path);
      if (!url) {
        const file = await idb.get<Blob>('files', path);
        if (!file) continue;
        url = URL.createObjectURL(file);
        objectUrls.set(path, url);
      }
      urls[path] = url;
    }
    return urls;
  }
}
