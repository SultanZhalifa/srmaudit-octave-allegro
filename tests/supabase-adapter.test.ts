import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAdapter } from '@/services/storage/supabase-adapter';

/** A small fake of the parts of the Supabase client that the evidence code touches. */
function fakeClient(overrides: Record<string, unknown> = {}) {
  const bucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
    createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn(),
    ...overrides,
  };
  const client = { storage: { from: vi.fn().mockReturnValue(bucket) } };
  return { client: client as unknown as SupabaseClient, bucket, from: client.storage.from };
}

describe('SupabaseAdapter evidence files', () => {
  it('uploads into the private evidence bucket under the user folder and never asks for a public URL', async () => {
    const { client, bucket, from } = fakeClient();
    const adapter = new SupabaseAdapter(client);
    const file = new File(['x'], 'my report (final).pdf', { type: 'application/pdf' });

    const result = await adapter.uploadFile('user-1', file);

    expect(from).toHaveBeenCalledWith('evidence');
    expect(result.stored).toBe('cloud');
    expect(result.path).toMatch(/^user-1\/\d+_my_report__final_.pdf$/);
    expect(bucket.upload).toHaveBeenCalledWith(result.path, file);
    expect(bucket.getPublicUrl).not.toHaveBeenCalled();
    expect(result).not.toHaveProperty('url');
  });

  it('surfaces an upload error', async () => {
    const { client } = fakeClient({
      upload: vi.fn().mockResolvedValue({ error: { message: 'too big' } }),
    });
    const adapter = new SupabaseAdapter(client);
    await expect(adapter.uploadFile('u', new File(['x'], 'a.png'))).rejects.toThrow('too big');
  });

  it('opens files through signed links that expire after an hour', async () => {
    const { client, bucket } = fakeClient({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: [
          { path: 'u/1_a.png', signedUrl: 'https://x.test/sign/a?token=1', error: null },
          { path: 'u/2_b.png', signedUrl: 'https://x.test/sign/b?token=2', error: null },
        ],
        error: null,
      }),
    });
    const adapter = new SupabaseAdapter(client);

    const urls = await adapter.getFileUrls(['u/1_a.png', 'u/2_b.png']);

    expect(bucket.createSignedUrls).toHaveBeenCalledWith(['u/1_a.png', 'u/2_b.png'], 3600);
    expect(urls).toEqual({
      'u/1_a.png': 'https://x.test/sign/a?token=1',
      'u/2_b.png': 'https://x.test/sign/b?token=2',
    });
  });

  it('leaves out files that could not be signed', async () => {
    const { client } = fakeClient({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: [
          { path: 'u/1_a.png', signedUrl: 'https://x.test/sign/a', error: null },
          { path: 'u/gone.png', signedUrl: null, error: 'Object not found' },
        ],
        error: null,
      }),
    });
    const urls = await new SupabaseAdapter(client).getFileUrls(['u/1_a.png', 'u/gone.png']);
    expect(Object.keys(urls)).toEqual(['u/1_a.png']);
  });

  it('does not call the network when there is nothing to sign', async () => {
    const { client, bucket } = fakeClient();
    expect(await new SupabaseAdapter(client).getFileUrls([])).toEqual({});
    expect(bucket.createSignedUrls).not.toHaveBeenCalled();
  });

  it('surfaces a signing error', async () => {
    const { client } = fakeClient({
      createSignedUrls: vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } }),
    });
    await expect(new SupabaseAdapter(client).getFileUrls(['u/a.png'])).rejects.toThrow('denied');
  });
});
