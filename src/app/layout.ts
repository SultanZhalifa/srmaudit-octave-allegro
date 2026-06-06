/** App shell layout: sidebar, topbar, sync indicator. Rendered after sign-in. */
import type { AuthUser } from '@/core/types';
import { NAV_GROUPS, PAGES, canAccess } from '@/core/constants';
import { backend } from '@/services/backend';
import { html, raw, toHtml, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';

export function renderAppShell(user: AuthUser): RawHtml {
  return html`
    <div class="sidebar-overlay" id="sidebarOverlay" data-action="sidebar:toggle"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <span class="logo-mark">${raw(icon('shield-check'))}</span>
        <div class="logo-text">
          <h2>SRMAudit</h2>
          <span>OCTAVE Allegro</span>
        </div>
      </div>
      <nav class="sidebar-nav">${renderNav(user)}</nav>
      <div class="sync-indicator" id="syncIndicator"></div>
      <div class="sidebar-footer">
        <div class="user-avatar">${(user.name || user.email || '?').charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-role">${user.role}</div>
        </div>
        <button class="icon-btn" data-action="theme:toggle" title="Toggle theme">
          <span data-theme-icon></span>
        </button>
        <button class="icon-btn" data-action="auth:logout" title="Sign out">
          ${raw(icon('log-out', 'icon'))}
        </button>
      </div>
    </aside>
    <div class="main-wrap">
      <header class="topbar">
        <button class="hamburger-btn" data-action="sidebar:toggle" title="Menu">
          ${raw(icon('menu', 'icon'))}
        </button>
        <span class="topbar-title" id="topbarTitle">Dashboard</span>
      </header>
      <main class="main-content" id="mainContent"></main>
    </div>
  `;
}

function renderNav(user: AuthUser): RawHtml {
  return html`${NAV_GROUPS.map(
    (group) => html`
      <div class="nav-section-label">${group.label}</div>
      ${group.items.map((page) => {
        const meta = PAGES[page];
        const locked = !canAccess(user.role, page);
        const glyph = meta.moduleNumber
          ? raw(`<span class="nav-num">${meta.moduleNumber}</span>`)
          : raw(icon(meta.icon, 'nav-icon'));
        return html`<div
          class="nav-item ${locked ? 'locked' : ''}"
          data-page="${page}"
          ${locked ? raw('title="No access for your role"') : raw(`data-action="nav:${page}"`)}
        >
          ${glyph}<span>${meta.title}</span>
        </div>`;
      })}
    `,
  )}`;
}

export function updateSyncIndicator(): void {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  const online = backend.ready && backend.user;
  const mode = backend.isCloud() ? 'Cloud' : 'Local';
  const time = backend.lastSyncedAt
    ? backend.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  el.innerHTML = toHtml(
    html`<span class="sync-dot ${online ? '' : 'offline'}"></span> ${mode} synced ${time}`,
  );
}

export function toggleSidebar(): void {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const open = !sidebar?.classList.contains('open');
  sidebar?.classList.toggle('open', open);
  overlay?.classList.toggle('active', open);
}
