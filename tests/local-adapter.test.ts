import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAdapter } from '@/services/storage/local-adapter';

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
