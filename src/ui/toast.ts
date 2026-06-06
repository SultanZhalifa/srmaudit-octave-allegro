/** Toast notifications, driven by the event bus. */
import { bus } from '@/core/events';
import { icon, type IconName } from './icons';

const ICONS: Record<string, IconName> = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

function escapeText(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

export function installToasts(): void {
  let container = document.querySelector<HTMLElement>('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const host = container;

  bus.on('toast', ({ message, type }) => {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icon(ICONS[type] ?? 'info', 'icon')}<span>${escapeText(message)}</span>`;
    host.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  });
}
