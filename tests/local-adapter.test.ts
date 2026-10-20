import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalAdapter, PASSWORD_ITERATIONS } from '@/services/storage/local-adapter';
import { idb } from '@/services/storage/indexeddb';
import { sha256 } from '@/core/utils';

// Each password check runs hundreds of thousands of PBKDF2 rounds; leave room on a slow CI machine.
vi.setConfig({ testTimeout: 30_000 });

// Each test gets a clean IndexedDB + localStorage (fake-indexeddb resets per file;
// we clear localStorage between tests).
beforeEach(() => {
  localStorage.clear();
});

describe('LocalAdapter auth', () => {
  it('signs up a new account and returns the profile', async () => {
    const a = new LocalAdapter();
    const res = await a.signUp('jane@example.com', 'secret123', 'Jane', 'auditor');
    expect(res.ok).toBe(true);
    expect(res.user?.email).toBe('jane@example.com');
    expect(res.user?.role).toBe('auditor');
    expect(res.user?.id).toMatch(/^local-/);
  });

  it('rejects duplicate sign-up', async () => {
    const a = new LocalAdapter();
    await a.signUp('dup@example.com', 'secret123', 'Dup', 'admin');
    await expect(a.signUp('dup@example.com', 'secret123', 'Dup', 'admin')).rejects.toThrow(
      /already exists/,
    );
  });

  it('signs in with correct credentials and rejects wrong password', async () => {
    const a = new LocalAdapter();
    await a.signUp('bob@example.com', 'rightpass', 'Bob', 'admin');
    await a.signOut();
    const user = await a.signIn('bob@example.com', 'rightpass');
    expect(user.name).toBe('Bob');
    await expect(a.signIn('bob@example.com', 'wrongpass')).rejects.toThrow(/Incorrect password/);
  });

  it('restores a session after sign-in', async () => {
    const a = new LocalAdapter();
    await a.signUp('sess@example.com', 'secret123', 'Sess', 'auditee');
    const restored = await a.restoreSession();
    expect(restored?.email).toBe('sess@example.com');
  });

  it('persists and reloads per-user workspace data', async () => {
    const a = new LocalAdapter();
    const { user } = await a.signUp('data@example.com', 'secret123', 'Data', 'admin');
    await a.save(user!.id, 'assets', [{ name: 'Server' }]);
    const all = await a.loadAll(user!.id);
    expect(all.assets).toEqual([{ name: 'Server' }]);
  });

  it('isolates data between users', async () => {
    const a = new LocalAdapter();
    const u1 = (await a.signUp('u1@example.com', 'secret123', 'U1', 'admin')).user!;
    const u2 = (await a.signUp('u2@example.com', 'secret123', 'U2', 'admin')).user!;
    await a.save(u1.id, 'risks', [{ score: 1 }]);
    const forU2 = await a.loadAll(u2.id);
    expect(forU2.risks).toBeUndefined();
  });
});

describe('LocalAdapter evidence files', () => {
  // jsdom has no object URLs; give each stored file a recognisable fake one.
  let counter = 0;
  const created: string[] = [];
  const revoked: string[] = [];
  beforeEach(() => {
    counter = 0;
    created.length = 0;
    revoked.length = 0;
    URL.createObjectURL = () => {
      const url = `blob:test/${++counter}`;
      created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => void revoked.push(url);
  });

  it('keeps the file in IndexedDB and returns a path, not a URL', async () => {
    const a = new LocalAdapter();
    const res = await a.uploadFile('local-abc', new File(['hello'], 'note.txt'));
    expect(res.stored).toBe('local');
    expect(res.path).toMatch(/^local-abc\/\d+_note.txt$/);
    expect(res).not.toHaveProperty('url');
  });

  it('gives a URL for a stored file, reuses it, and drops it on delete', async () => {
    const a = new LocalAdapter();
    const { path } = await a.uploadFile('local-abc', new File(['hello'], 'pic.png'));

    const first = await a.getFileUrls([path]);
    const again = await a.getFileUrls([path]);
    expect(first[path]).toBe('blob:test/1');
    expect(again[path]).toBe('blob:test/1');
    expect(created).toHaveLength(1);

    await a.deleteFile(path);
    expect(revoked).toEqual(['blob:test/1']);
    expect(await a.getFileUrls([path])).toEqual({});
  });

  it('leaves out paths that are not stored', async () => {
    const a = new LocalAdapter();
    expect(await a.getFileUrls(['local-abc/missing.png'])).toEqual({});
  });
});

interface StoredAccount {
  hash: string;
  profile: { id: string; email: string; name: string; role: string };
  kdf?: string;
  salt?: string;
  iterations?: number;
}
const stored = (email: string) => idb.get<StoredAccount>('accounts', email);

describe('LocalAdapter password storage', () => {
  it('stores a salted PBKDF2 hash, never the plain SHA-256 of the password', async () => {
    const a = new LocalAdapter();
    await a.signUp('new@example.com', 'a-long-passphrase', 'New', 'auditor');
    const account = await stored('new@example.com');
    expect(account?.kdf).toBe('pbkdf2-sha256');
    expect(account?.iterations).toBe(PASSWORD_ITERATIONS);
    expect(account?.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(account?.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(account?.hash).not.toBe(await sha256('a-long-passphrase'));
  });

  it('gives two accounts with the same password different salts and hashes', async () => {
    const a = new LocalAdapter();
    await a.signUp('one@example.com', 'same-password', 'One', 'auditor');
    await a.signUp('two@example.com', 'same-password', 'Two', 'auditor');
    const [one, two] = [await stored('one@example.com'), await stored('two@example.com')];
    expect(one?.salt).not.toBe(two?.salt);
    expect(one?.hash).not.toBe(two?.hash);
  });

  it('signs in with a salted account and rejects a wrong password', async () => {
    const a = new LocalAdapter();
    await a.signUp('ok@example.com', 'right-password', 'Ok', 'admin');
    await a.signOut();
    expect((await a.signIn('ok@example.com', 'right-password')).email).toBe('ok@example.com');
    await expect(a.signIn('ok@example.com', 'wrong-password')).rejects.toThrow(
      /Incorrect password/,
    );
  });

  describe('an account created before salting existed', () => {
    const legacy = async (email: string, password: string) =>
      idb.set('accounts', email, {
        hash: await sha256(password),
        profile: { id: 'local-legacy', email, name: 'Legacy', role: 'auditor' },
      });

    it('still signs in, and is moved to a salted hash on that sign-in', async () => {
      await legacy('old@example.com', 'old-password');
      const a = new LocalAdapter();

      const user = await a.signIn('old@example.com', 'old-password');
      expect(user.id).toBe('local-legacy');

      const upgraded = await stored('old@example.com');
      expect(upgraded?.kdf).toBe('pbkdf2-sha256');
      expect(upgraded?.salt).toMatch(/^[0-9a-f]{32}$/);
      expect(upgraded?.hash).not.toBe(await sha256('old-password'));
      expect(upgraded?.profile.id).toBe('local-legacy');

      // and keeps working afterwards, on the new hash
      await a.signOut();
      expect((await a.signIn('old@example.com', 'old-password')).email).toBe('old@example.com');
      await expect(a.signIn('old@example.com', 'nope')).rejects.toThrow(/Incorrect password/);
    });

    it('is left alone when the password is wrong', async () => {
      await legacy('keep@example.com', 'real-password');
      const a = new LocalAdapter();
      await expect(a.signIn('keep@example.com', 'guess')).rejects.toThrow(/Incorrect password/);
      const account = await stored('keep@example.com');
      expect(account?.kdf).toBeUndefined();
      expect(account?.hash).toBe(await sha256('real-password'));
    });
  });

  it('re-hashes at the current work factor when an older, weaker one is stored', async () => {
    const a = new LocalAdapter();
    await a.signUp('weak@example.com', 'some-password', 'Weak', 'auditor');
    const before = await stored('weak@example.com');
    const { pbkdf2Hex } = await import('@/core/utils');
    await idb.set('accounts', 'weak@example.com', {
      ...before,
      iterations: 1_000,
      hash: await pbkdf2Hex('some-password', before?.salt ?? '', 1_000),
    });

    await a.signIn('weak@example.com', 'some-password');
    const after = await stored('weak@example.com');
    expect(after?.iterations).toBe(PASSWORD_ITERATIONS);
    expect(after?.salt).not.toBe(before?.salt);
  });
});
