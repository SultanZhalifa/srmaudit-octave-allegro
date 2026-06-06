/**
 * DOM helpers and a small event-delegation system. Instead of global
 * `onclick="App.x()"` handlers, markup declares `data-action="name"` and
 * features register handlers by name. One document-level listener dispatches
 * them, so there is no global window pollution and handlers stay scoped.
 */
import type { RawHtml } from './html';
import { toHtml } from './html';

export type ActionHandler = (el: HTMLElement, event: Event) => void;

const clickHandlers = new Map<string, ActionHandler>();
const inputHandlers = new Map<string, ActionHandler>();
const changeHandlers = new Map<string, ActionHandler>();

/** Register a click action by name (returns an unregister fn). */
export function onAction(name: string, handler: ActionHandler): () => void {
  clickHandlers.set(name, handler);
  return () => clickHandlers.delete(name);
}
export function onInput(name: string, handler: ActionHandler): () => void {
  inputHandlers.set(name, handler);
  return () => inputHandlers.delete(name);
}
export function onChange(name: string, handler: ActionHandler): () => void {
  changeHandlers.set(name, handler);
  return () => changeHandlers.delete(name);
}

function dispatch(map: Map<string, ActionHandler>, attr: string, event: Event): void {
  const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(`[${attr}]`);
  if (!target) return;
  const name = target.getAttribute(attr);
  if (!name) return;
  const handler = map.get(name);
  if (handler) handler(target, event);
}

/** Install the global delegated listeners once. */
export function installDelegation(): void {
  document.addEventListener('click', (e) => dispatch(clickHandlers, 'data-action', e));
  document.addEventListener('input', (e) => dispatch(inputHandlers, 'data-input', e));
  document.addEventListener('change', (e) => dispatch(changeHandlers, 'data-change', e));
}

/** Render an html template into a container element. */
export function mount(container: HTMLElement, content: RawHtml | string): void {
  container.innerHTML = toHtml(content);
}

/** Typed element getters. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
export function requireId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = byId<T>(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}
export function inputValue(id: string): string {
  return byId<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id)?.value.trim() ?? '';
}
