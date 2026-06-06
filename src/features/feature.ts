/**
 * Feature contract. Every page is a Feature: it renders markup and optionally
 * runs side effects after mount (charts, focus, delegated handlers are global).
 * Features are registered in the router by {@link PageId}.
 */
import type { RawHtml } from '@/ui/html';

export interface Feature {
  /** Return the page markup. Pure with respect to the DOM. */
  render(): RawHtml;
  /** Optional: run after the markup is in the DOM (e.g. draw charts). */
  onMount?(): void;
}
