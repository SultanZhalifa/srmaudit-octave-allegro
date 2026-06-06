/**
 * Supabase storage adapter — cloud mode. Real Supabase Auth, per-user
 * row-level-secured `app_data` table, and evidence file storage.
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { AuthUser, Role } from '@/core/types';
import { config } from '@/core/config';
import type { SignUpResult, StorageAdapter, UploadedFile } from './storage-adapter';

const BUCKET = 'evidence';

/** Translate raw Supabase auth errors into clear, actionable guidance. */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('exceeded')) {
    return 'Email rate limit reached. Turn off "Confirm email" in Supabase → Authentication → Providers → Email, then try again (no email is sent after that).';
  }
  if (m.includes('not confirmed') || m.includes('confirm')) {
    return 'This account exists but its email is not confirmed. Confirm via the email link, or turn off "Confirm email" in Supabase Authentication settings.';
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'An account with this email already exists. Switch to Sign In.';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Incorrect email or password.';
  }
  return message;
}

function mapUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as { name?: string; role?: Role };
  return {
    id: u.id,
    email: u.email ?? '',
    name: meta.name || (u.email ?? '').split('@')[0] || (u.email ?? ''),
    role: meta.role ?? 'auditor',
  };
}

export class SupabaseAdapter implements StorageAdapter {
  readonly mode = 'cloud' as const;
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey);
  }

  async restoreSession(): Promise<AuthUser | null> {
    const {
      data: { session },
    } = await this.client.auth.getSession();
    return session ? mapUser(session.user) : null;
  }

  async signUp(email: string, password: string, name: string, role: Role): Promise<SignUpResult> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split('@')[0], role } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (data.session && data.user) return { ok: true, user: mapUser(data.user) };
    return { ok: true, needsConfirm: true };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    return mapUser(data.user);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  }

  async loadAll(): Promise<Record<string, unknown>> {
    const { data, error } = await this.client.from('app_data').select('key, value');
    if (error) throw new Error(error.message);
    const result: Record<string, unknown> = {};
    for (const row of data ?? []) result[row.key as string] = row.value;
    return result;
  }

  async save(userId: string, key: string, value: unknown): Promise<void> {
    const { error } = await this.client
      .from('app_data')
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' },
      );
    if (error) throw new Error(error.message);
  }

  async remove(_userId: string, key: string): Promise<void> {
    const { error } = await this.client.from('app_data').delete().eq('key', key);
    if (error) throw new Error(error.message);
  }

  async uploadFile(userId: string, file: File): Promise<UploadedFile> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}_${safe}`;
    const { error } = await this.client.storage.from(BUCKET).upload(path, file);
    if (error) throw new Error(error.message);
    const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path, stored: 'cloud' };
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.storage.from(BUCKET).remove([path]);
  }
}
