import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { pbkdf2Sync } from 'node:crypto';
import { constantTimeEqual, pbkdf2Hex, randomHex, sha256 } from '@/core/utils';
import { PASSWORD_ITERATIONS } from '@/services/storage/local-adapter';

describe('password hashing helpers', () => {
  it('matches the published PBKDF2-HMAC-SHA256 test vector', async () => {
    // password "password", salt "salt" (hex 73616c74), 1 iteration, 32 bytes
    expect(await pbkdf2Hex('password', '73616c74', 1)).toBe(
      '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
    );
  });

  it('agrees with Node at the iteration count the app uses', async () => {
    const salt = '00112233445566778899aabbccddeeff';
    const expected = pbkdf2Sync(
      'correct horse',
      Buffer.from(salt, 'hex'),
      PASSWORD_ITERATIONS,
      32,
      'sha256',
    );
    expect(await pbkdf2Hex('correct horse', salt, PASSWORD_ITERATIONS)).toBe(
      expected.toString('hex'),
    );
  }, 30_000);

  it('gives a different hash for a different salt or password', async () => {
    const a = await pbkdf2Hex('secret', 'aa', 10);
    expect(await pbkdf2Hex('secret', 'bb', 10)).not.toBe(a);
    expect(await pbkdf2Hex('Secret', 'aa', 10)).not.toBe(a);
    expect(await pbkdf2Hex('secret', 'aa', 10)).toBe(a);
  });

  it('makes random salts of the requested length', () => {
    const a = randomHex(16);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(randomHex(16)).not.toBe(a);
  });

  it('compares strings by value and length', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
  });

  it('keeps sha256 available for non-password uses', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
