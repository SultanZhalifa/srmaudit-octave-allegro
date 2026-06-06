/**
 * Reusable presentational components. Each returns composable, XSS-safe markup
 * via the `html` template. Features build pages from these instead of writing
 * raw HTML strings — so styling and structure stay consistent and DRY.
 */
import { html, raw, type RawHtml } from './html';
import { icon, type IconName } from './icons';

export function card(opts: {
  title?: string;
  titleIcon?: IconName;
  actions?: RawHtml | string;
  body: RawHtml | string;
  className?: string;
}): RawHtml {
  return html`
    <div class="card ${opts.className ?? 'fade-up'}">
      ${opts.title
        ? html`<div class="card-header">
            <h3>${opts.titleIcon ? raw(icon(opts.titleIcon, 'icon')) : ''} ${opts.title}</h3>
            ${opts.actions
              ? raw(typeof opts.actions === 'string' ? opts.actions : opts.actions.value)
              : ''}
          </div>`
        : ''}
      ${typeof opts.body === 'string' ? raw(opts.body) : opts.body}
    </div>
  `;
}

export function statCard(opts: {
  icon: IconName;
  value: number;
  label: string;
  suffix?: string;
}): RawHtml {
  return html`
    <div class="stat-card">
      <div class="stat-icon">${raw(icon(opts.icon, 'icon'))}</div>
      <div
        class="stat-value"
        data-count="${opts.value}"
        ${opts.suffix ? raw(`data-suffix="${opts.suffix}"`) : ''}
      >
        0${opts.suffix ?? ''}
      </div>
      <div class="stat-label">${opts.label}</div>
    </div>
  `;
}

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export function badge(
  text: string,
  variant: BadgeVariant = 'default',
  leadingIcon?: IconName,
): RawHtml {
  const cls = variant === 'default' ? 'badge' : `badge badge-${variant}`;
  return html`<span class="${cls}"
    >${leadingIcon ? raw(icon(leadingIcon, 'icon')) : ''} ${text}</span
  >`;
}

export function emptyState(opts: {
  icon: IconName;
  title: string;
  message: string;
  action?: RawHtml | string;
}): RawHtml {
  return html`
    <div class="empty-state">
      <div class="empty-icon">${raw(icon(opts.icon, 'icon'))}</div>
      <h3>${opts.title}</h3>
      <p>${opts.message}</p>
      ${opts.action ? raw(typeof opts.action === 'string' ? opts.action : opts.action.value) : ''}
    </div>
  `;
}

export interface ButtonOptions {
  label: string;
  icon?: IconName;
  action: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'lg';
  block?: boolean;
  attrs?: string;
}

export function button(opts: ButtonOptions): RawHtml {
  const classes = [
    'btn',
    `btn-${opts.variant ?? 'secondary'}`,
    opts.size ? `btn-${opts.size}` : '',
    opts.block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return html`<button
    class="${classes}"
    data-action="${opts.action}"
    ${opts.attrs ? raw(opts.attrs) : ''}
  >
    ${opts.icon ? raw(icon(opts.icon, 'icon')) : ''} ${opts.label}
  </button>`;
}

export function iconButton(opts: {
  icon: IconName;
  action: string;
  tooltip?: string;
  attrs?: string;
}): RawHtml {
  return html`<button
    class="btn btn-secondary btn-sm btn-icon"
    data-action="${opts.action}"
    ${opts.tooltip ? raw(`data-tooltip="${opts.tooltip}"`) : ''}
    ${opts.attrs ? raw(opts.attrs) : ''}
  >
    ${raw(icon(opts.icon, 'icon'))}
  </button>`;
}

export function searchBox(opts: {
  placeholder: string;
  inputAction: string;
  width?: string;
}): RawHtml {
  return html`<div class="input-wrap">
    ${raw(icon('search', 'input-icon icon-sm'))}
    <input
      class="form-control"
      style="${opts.width ? `width:${opts.width};` : ''}height:36px;"
      placeholder="${opts.placeholder}"
      data-input="${opts.inputAction}"
    />
  </div>`;
}

export function pageHeader(opts: {
  title: string;
  subtitle: string;
  actions?: RawHtml | string;
}): RawHtml {
  return html`
    <div class="page-header fade-up">
      <h1>${opts.title}</h1>
      <p>${opts.subtitle}</p>
      ${opts.actions
        ? html`<div class="header-actions btn-group">${raw(toStr(opts.actions))}</div>`
        : ''}
    </div>
  `;
}

function toStr(v: RawHtml | string): string {
  return typeof v === 'string' ? v : v.value;
}
