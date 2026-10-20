import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Vitest runs from the repository root. (import.meta.url is an http URL in the jsdom environment.)
const root = resolve('.');
const schema = readFileSync(join(root, 'schema.sql'), 'utf8');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.ts$/.test(name) ? [full] : [];
  });
}

describe('evidence bucket', () => {
  it('is created private, and an existing public one is switched to private', () => {
    expect(schema).toMatch(
      /insert into storage\.buckets \(id, name, public\)\s+values \('evidence', 'evidence', false\)/,
    );
    expect(schema).toMatch(/on conflict \(id\) do update set public = false/);
    expect(schema).not.toMatch(/values \('evidence', 'evidence', true\)/);
  });

  it('keeps a read policy limited to the folder named after the user', () => {
    expect(schema).toMatch(
      /create policy "evidence read own"[\s\S]*?\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/,
    );
  });

  it('is never opened through a public URL in the app code', () => {
    const offenders = sourceFiles(join(root, 'src')).filter((f) =>
      readFileSync(f, 'utf8').includes('getPublicUrl'),
    );
    expect(offenders).toEqual([]);
  });
});
