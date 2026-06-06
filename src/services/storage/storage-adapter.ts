/**
 * Storage port. The repository and auth services depend on this interface, not
 * on Supabase or IndexedDB directly (ports & adapters). This is what lets the
 * app run identically in cloud or local mode and makes everything testable.
 */
import type { AuthUser, Role } from '@/core/types';

export interface SignUpResult {
  ok: boolean;
  user?: AuthUser;
  needsConfirm?: boolean;
}

export interface UploadedFile {
  url: string;
  path: string;
  stored: 'cloud' | 'local';
}

export interface StorageAdapter {
  readonly mode: 'cloud' | 'local';

  // ----- Auth -----
  restoreSession(): Promise<AuthUser | null>;
  signUp(email: string, password: string, name: string, role: Role): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;

  // ----- Per-user key/value workspace data -----
  loadAll(userId: string): Promise<Record<string, unknown>>;
  save(userId: string, key: string, value: unknown): Promise<void>;
  remove(userId: string, key: string): Promise<void>;

  // ----- Evidence files -----
  uploadFile(userId: string, file: File): Promise<UploadedFile>;
  deleteFile(path: string): Promise<void>;
}
