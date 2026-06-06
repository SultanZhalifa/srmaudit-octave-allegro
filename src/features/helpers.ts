/** Shared helpers used by feature modules. */
import type { PageId } from '@/core/constants';
import { bus, toast } from '@/core/events';
import { backend } from '@/services/backend';
import type { Repository } from '@/services/repository';

/** The repository for the signed-in user. */
export function repo(): Repository {
  return backend.repo;
}

/** Request a navigation to another page. */
export function navigate(page: PageId): void {
  bus.emit('navigate', { page });
}

export { toast };

/** Confirm dialog wrapper (kept here so features don't touch globals directly). */
export function confirmAction(message: string): boolean {
  return window.confirm(message);
}
