/** Router — maps page ids to features, enforces RBAC, renders into #mainContent. */
import type { PageId } from '@/core/constants';
import { PAGES, canAccess, isViewOnly } from '@/core/constants';
import { bus, toast } from '@/core/events';
import { backend } from '@/services/backend';
import { html, raw, toHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import type { Feature } from '@/features/feature';
import { dashboardFeature } from '@/features/dashboard/dashboard';
import { usersFeature } from '@/features/users/users';
import { organizationFeature } from '@/features/organization/organization';
import { assetsFeature } from '@/features/assets/assets';
import { threatsFeature } from '@/features/threats/threats';
import { riskFeature } from '@/features/risk/risk';
import { auditFeature } from '@/features/audit/audit';
import { evidenceFeature } from '@/features/evidence/evidence';
import { complianceFeature } from '@/features/compliance/compliance';
import { findingsFeature } from '@/features/findings/findings';
import { aiFeature } from '@/features/ai/ai';
import { reportFeature } from '@/features/report/report';
import { settingsFeature } from '@/features/settings/settings';
import { docsFeature } from '@/features/docs/docs';

const FEATURES: Record<PageId, Feature> = {
  dashboard: dashboardFeature,
  users: usersFeature,
  organization: organizationFeature,
  assets: assetsFeature,
  threats: threatsFeature,
  risk: riskFeature,
  audit: auditFeature,
  evidence: evidenceFeature,
  compliance: complianceFeature,
  findings: findingsFeature,
  ai: aiFeature,
  report: reportFeature,
  settings: settingsFeature,
  docs: docsFeature,
};

let current: PageId = 'dashboard';

export function currentPage(): PageId {
  return current;
}

export function navigateTo(page: PageId): void {
  const role = backend.user?.role;
  if (!canAccess(role, page)) {
    toast('Access denied for your role', 'error');
    return;
  }
  current = page;

  document.querySelectorAll<HTMLElement>('.nav-item').forEach((n) => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  const topbarTitle = document.getElementById('topbarTitle');
  if (topbarTitle) topbarTitle.textContent = PAGES[page].title;

  const main = document.getElementById('mainContent');
  if (!main) return;
  main.style.opacity = '0';
  main.style.transform = 'translateY(10px)';

  setTimeout(() => {
    const feature = FEATURES[page];
    try {
      main.innerHTML = toHtml(breadcrumb(page)) + toHtml(feature.render());
    } catch (err) {
      console.error(`[router] render error on "${page}":`, err);
      main.innerHTML =
        toHtml(breadcrumb(page)) +
        `<div class="card"><div class="empty-state"><div class="empty-icon">${icon('bug', 'icon')}</div><h3>Render Error</h3><p>${(err as Error).message}</p></div></div>`;
    }
    requestAnimationFrame(() => {
      main.style.opacity = '1';
      main.style.transform = 'translateY(0)';
    });
    if (isViewOnly(role, page)) applyViewOnly(main);
    feature.onMount?.();
    animateCounters();
    bus.emit('sync-updated', undefined);
  }, 140);
}

function breadcrumb(page: PageId) {
  return html`<div class="breadcrumb">
    <a href="#" data-action="nav:dashboard">Home</a>${raw(icon('chevron-right', 'icon sep'))}<span
      class="current"
      >${PAGES[page].title}</span
    >
  </div>`;
}

function applyViewOnly(main: HTMLElement): void {
  setTimeout(() => {
    const editSelectors =
      'button[data-action*=":add"],button[data-action*=":save"],button[data-action*=":update"],button[data-action*=":delete"],button[data-action*=":edit"],button[data-action*=":generate"],button[data-action*=":run"],button[data-action*="data:example"],button[data-action*=":containers"],input[type="file"],button[data-action*=":pick"]';
    main.querySelectorAll<HTMLElement>(editSelectors).forEach((el) => (el.style.display = 'none'));
    const h = main.querySelector('.page-header h1');
    if (h && !h.querySelector('.readonly-badge')) {
      h.insertAdjacentHTML(
        'beforeend',
        ' <span class="badge badge-warning readonly-badge" style="font-size:0.66rem;vertical-align:middle;">View Only</span>',
      );
    }
  }, 10);
}

function animateCounters(): void {
  document.querySelectorAll<HTMLElement>('.stat-value[data-count]').forEach((el) => {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix ?? '';
    if (target === 0) {
      el.textContent = '0' + suffix;
      return;
    }
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 24));
    const timer = setInterval(() => {
      cur += step;
      if (cur >= target) {
        cur = target;
        clearInterval(timer);
      }
      el.textContent = cur + suffix;
    }, 28);
  });
}
