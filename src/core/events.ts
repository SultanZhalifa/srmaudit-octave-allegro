/**
 * A tiny typed publish/subscribe bus. Features emit domain events and the shell
 * (or other features) react, without importing each other directly — this keeps
 * the dependency graph acyclic and the features independently testable.
 */
import type { PageId } from './constants';

export interface AppEvents {
  toast: { message: string; type: 'success' | 'error' | 'warning' | 'info' };
  navigate: { page: PageId };
  'data-changed': { key: string };
  'sync-updated': void;
  'auth-changed': void;
}

type Handler<T> = (payload: T) => void;

class EventBus {
  // Stored loosely; the public methods provide the type-safe surface.
  private handlers = new Map<keyof AppEvents, Set<Handler<never>>>();

  on<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        (h as Handler<AppEvents[K]>)(payload);
      } catch (err) {
        console.error(`[events] handler for "${String(event)}" threw:`, err);
      }
    });
  }
}

export const bus = new EventBus();

/** Convenience helper used everywhere instead of importing the bus directly. */
export function toast(message: string, type: AppEvents['toast']['type'] = 'success'): void {
  bus.emit('toast', { message, type });
}
