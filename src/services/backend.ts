/**
 * Backend — the application's data & identity facade. Selects the storage
 * adapter from config, manages the authenticated session, and exposes a
 * {@link Repository} bound to the current user. Features depend on this.
 */
import type { AuthUser, Role } from '@/core/types';
import { config } from '@/core/config';
import { bus } from '@/core/events';
import type { SignUpResult, StorageAdapter, UploadedFile } from './storage/storage-adapter';
import { LocalAdapter } from './storage/local-adapter';
import { Repository } from './repository';

class Backend {
  private adapter: StorageAdapter = new LocalAdapter();
  private _repo: Repository | null = null;
  user: AuthUser | null = null;
  ready = false;

  get mode(): 'cloud' | 'local' {
    return this.adapter.mode;
  }

  isCloud(): boolean {
    return this.adapter.mode === 'cloud';
  }

  /** The repository for the current session. Throws if not signed in. */
  get repo(): Repository {
    if (!this._repo) throw new Error('Repository accessed before sign-in');
    return this._repo;
  }

  get lastSyncedAt(): Date | null {
    return this._repo?.lastSyncedAt ?? null;
  }

  /** Initialise the adapter (cloud if configured, else local). */
  async init(): Promise<void> {
    if (config.cloudConfigured) {
      try {
        // Lazy import keeps the Supabase SDK out of the bundle in local-only deployments.
        const { SupabaseAdapter } = await import('./storage/supabase-adapter');
        this.adapter = new SupabaseAdapter();
      } catch (e) {
        console.warn('[backend] Supabase init failed, using local mode:', e);
        this.adapter = new LocalAdapter();
      }
    }
    this.ready = true;
  }

  private async startSession(user: AuthUser): Promise<void> {
    this.user = user;
    this._repo = new Repository(this.adapter, user.id);
    await this._repo.hydrate();
    bus.emit('auth-changed', undefined);
  }

  async restoreSession(): Promise<AuthUser | null> {
    const user = await this.adapter.restoreSession();
    if (user) await this.startSession(user);
    return user;
  }

  async signUp(email: string, password: string, name: string, role: Role): Promise<SignUpResult> {
    const res = await this.adapter.signUp(email, password, name, role);
    if (res.user) await this.startSession(res.user);
    return res;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const user = await this.adapter.signIn(email, password);
    await this.startSession(user);
    return user;
  }

  async signOut(): Promise<void> {
    await this.adapter.signOut();
    this.user = null;
    this._repo = null;
    bus.emit('auth-changed', undefined);
  }

  resetPassword(email: string): Promise<void> {
    return this.adapter.resetPassword(email);
  }

  uploadFile(file: File): Promise<UploadedFile> {
    return this.repo.uploadFile(file);
  }

  deleteFile(path: string): Promise<void> {
    return this.repo.deleteFile(path);
  }
}

export const backend = new Backend();
