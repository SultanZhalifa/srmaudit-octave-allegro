/** Modal dialog service. A single reusable overlay, content set per call. */
import { html, raw, toHtml, type RawHtml } from './html';
import { icon } from './icons';

export interface ModalOptions {
  title: string;
  body: RawHtml | string;
  footer?: RawHtml | string;
  large?: boolean;
}

let overlay: HTMLElement | null = null;

function ensureOverlay(): HTMLElement {
  if (overlay) return overlay;
  const el = document.createElement('div');
  el.className = 'modal-overlay';
  el.id = 'modalOverlay';
  el.innerHTML = toHtml(html`
    <div class="modal" id="modalContent">
      <div class="modal-header">
        <h3 id="modalTitle"></h3>
        <button class="modal-close" data-modal-close>${raw(icon('x', 'icon'))}</button>
      </div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer" id="modalFooter"></div>
    </div>
  `);
  el.addEventListener('click', (e) => {
    if (e.target === el || (e.target as HTMLElement).closest('[data-modal-close]')) closeModal();
  });
  document.body.appendChild(el);
  overlay = el;
  return el;
}

export function openModal(options: ModalOptions): void {
  const el = ensureOverlay();
  (el.querySelector('#modalTitle') as HTMLElement).textContent = options.title;
  (el.querySelector('#modalBody') as HTMLElement).innerHTML = toHtml(options.body);
  (el.querySelector('#modalFooter') as HTMLElement).innerHTML = options.footer
    ? toHtml(options.footer)
    : '';
  (el.querySelector('#modalContent') as HTMLElement).className = options.large
    ? 'modal modal-lg'
    : 'modal';
  el.classList.add('active');
}

export function closeModal(): void {
  overlay?.classList.remove('active');
}

export function installModalKeybinds(): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}
