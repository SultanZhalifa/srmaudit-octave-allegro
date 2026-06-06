/**
 * Repository — typed, cached access to the workspace dataset. Reads come from an
 * in-memory cache (instant); writes are write-through with debounced persistence
 * to the active storage adapter (cloud or local). This is the single gateway the
 * features use for data; they never touch storage adapters directly.
 */
import type { WorkspaceData, WorkspaceKey } from '@/core/types';
import { EMPTY_ORGANIZATION } from '@/core/types';
import { WORKSPACE_KEYS } from '@/core/constants';
import { bus, toast } from '@/core/events';
import type { StorageAdapter, UploadedFile } from './storage/storage-adapter';

/** Default empty value for each workspace key. */
const DEFAULTS: WorkspaceData = {
  users: [],
  organization: EMPTY_ORGANIZATION,
  assets: [],
  assetThreats: {},
  riskCriteria: {},
  risks: [],
  auditChecklist: [],
  evidence: [],
  findings: [],
  activityLog: [],
};

export class Repository {
  private cache = new Map<string, unknown>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  lastSyncedAt: Date | null = null;

  constructor(
    private readonly adapter: StorageAdapter,
    private userId: string,
  ) {}

  get mode(): 'cloud' | 'local' {
    return this.adapter.mode;
  }

  /** Hydrate the cache from the backend for the current user. */
  async hydrate(): Promise<void> {
    this.cache.clear();
    try {
      const data = await this.adapter.loadAll(this.userId);
      for (const [k, v] of Object.entries(data)) this.cache.set(k, v);
      this.lastSyncedAt = new Date();
    } catch (e) {
      // A missing table (schema not yet applied) or transient network error must
      // not block sign-in — start with an empty workspace and surface a hint.
      console.warn('[repo] hydrate failed; starting empty:', e);
      const msg = (e as Error).message ?? '';
      if (msg.includes('app_data') || msg.includes('schema cache')) {
        toast('Connected, but the database is not set up yet. Run schema.sql in Supabase to enable cloud sync.', 'warning');
      }
    }
  }

  /** Typed read with the correct default. */
  get<K extends WorkspaceKey>(key: K): WorkspaceData[K] {
    return this.cache.has(key)
      ? (this.cache.get(key) as WorkspaceData[K])
      : (DEFAULTS[key] as WorkspaceData[K]);
  }

  /** Write-through set: update cache immediately, persist after a short debounce. */
  set<K extends WorkspaceKey>(key: K, value: WorkspaceData[K]): void {
    this.cache.set(key, value);
    bus.emit('data-changed', { key });
    this.schedulePersist(key, value);
  }

  remove(key: WorkspaceKey): void {
    this.cache.delete(key);
    bus.emit('data-changed', { key });
    void this.adapter
      .remove(this.userId, key)
      .catch((e) => console.warn(`[repo] remove ${key}:`, e));
  }

  /** Clear all workspace data for the current user. */
  reset(): void {
    for (const key of WORKSPACE_KEYS) this.remove(key);
  }

  private schedulePersist(key: string, value: unknown): void {
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        void this.persist(key, value, 0);
      }, 400),
    );
  }

  private async persist(key: string, value: unknown, attempt: number): Promise<void> {
    try {
      await this.adapter.save(this.userId, key, value);
      this.lastSyncedAt = new Date();
      bus.emit('sync-updated', undefined);
    } catch (e) {
      if (attempt < 2) {
        setTimeout(() => void this.persist(key, value, attempt + 1), (attempt + 1) * 1000);
      } else {
        console.warn(`[repo] persist failed for "${key}":`, e);
      }
    }
  }

  // ----- Evidence files -----
  uploadFile(file: File): Promise<UploadedFile> {
    return this.adapter.uploadFile(this.userId, file);
  }

  deleteFile(path: string): Promise<void> {
    return this.adapter.deleteFile(path);
  }
}
