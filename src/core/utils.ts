/** Small framework-agnostic helpers used across the app. */

/** HTML-escape a value for safe interpolation into markup. */
export function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Debounce a function by `ms` milliseconds. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms = 300,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Resolve after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Race a promise against a timeout, resolving to `fallback` if it is too slow. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, sleep(ms).then(() => fallback)]);
}

/** SHA-256 hex digest (used for local account password hashing). */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** A valid-enough email check for form validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Current time formatted as `HH:MM · DD/MM/YYYY`. */
export function timestamp(date = new Date()): string {
  return (
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' +
    date.toLocaleDateString()
  );
}
