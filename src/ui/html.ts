/**
 * Safe HTML templating. The `html` tagged template auto-escapes every
 * interpolated value, so markup is XSS-safe by default. Trusted fragments
 * (icons, already-built component strings) opt out via `raw()`.
 *
 *   html`<h1>${userInput}</h1>`            // userInput is escaped
 *   html`<div>${raw(icon('check'))}</div>` // icon markup is trusted
 *   html`${items.map((i) => html`<li>${i}</li>`)}` // arrays are joined
 */
import { escapeHtml } from '@/core/utils';

const RAW = Symbol('raw-html');

export interface RawHtml {
  [RAW]: true;
  value: string;
}

export function raw(value: string): RawHtml {
  return { [RAW]: true, value };
}

function isRaw(v: unknown): v is RawHtml {
  return typeof v === 'object' && v !== null && (v as RawHtml)[RAW] === true;
}

type Interpolation = string | number | boolean | null | undefined | RawHtml | Interpolation[];

function render(value: Interpolation): string {
  if (value == null || value === false || value === true) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (isRaw(value)) return value.value;
  return escapeHtml(value);
}

/** Tagged template returning a {@link RawHtml} (composable and trusted). */
export function html(strings: TemplateStringsArray, ...values: Interpolation[]): RawHtml {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + (strings[i + 1] ?? '');
  }
  return raw(out);
}

/** Convert an {@link html} result (or string) to a final markup string. */
export function toHtml(value: RawHtml | string): string {
  return isRaw(value) ? value.value : value;
}
