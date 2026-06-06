/** Audit checklist feature (OCTAVE module 6). */
import type { ControlStatus } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button, emptyState, searchBox } from '@/ui/components';
import { onAction, onInput, onChange, inputValue } from '@/ui/dom';
import { openModal, closeModal } from '@/ui/modal';
import { generateChecklist } from '@/services/engines/findings-engine';
import { getComplianceStats } from '@/services/engines/compliance-engine';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, navigate } from '../helpers';

const STATUSES: ControlStatus[] = ['pending', 'compliant', 'partially', 'non-compliant', 'na'];
const STATUS_LABEL: Record<ControlStatus, string> = {
  pending: 'Pending',
  compliant: 'Compliant',
  partially: 'Partially Compliant',
  'non-compliant': 'Non-Compliant',
  na: 'N/A',
};
let registered = false;

function register(): void {
  if (registered) return;
  registered = true;

  onAction('audit:generate', () => {
    const checklist = generateChecklist(repo().get('assetThreats'));
    repo().set('auditChecklist', checklist);
    logActivity('Checklist Generated', `${checklist.length} controls`, 'warning');
    toast(`${checklist.length} audit items generated`);
    navigate('audit');
  });

  onAction('audit:add', () => {
    openModal({
      title: 'Add Custom Control',
      body: html`
        <div class="form-group">
          <label>Audit Control</label
          ><input class="form-control" id="cTitle" placeholder="Verify that…" />
        </div>
        <div class="form-group">
          <label>Description</label
          ><textarea class="form-control" id="cDesc" placeholder="Details…"></textarea>
        </div>
      `,
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Add',
        icon: 'save',
        action: 'audit:save',
        variant: 'primary',
      })}`,
    });
  });

  onAction('audit:save', () => {
    const title = inputValue('cTitle');
    if (!title) return toast('Enter an audit control', 'error');
    const checklist = repo().get('auditChecklist');
    checklist.push({
      title,
      description: inputValue('cDesc'),
      source: 'Custom',
      status: 'pending',
      notes: '',
    });
    repo().set('auditChecklist', checklist);
    closeModal();
    toast('Control added');
    navigate('audit');
  });

  onChange('audit:status', (el) => {
    const i = Number(el.dataset.index);
    const checklist = repo().get('auditChecklist');
    const item = checklist[i];
    if (!item) return;
    item.status = (el as HTMLSelectElement).value as ControlStatus;
    repo().set('auditChecklist', checklist);
    logActivity(
      'Control Updated',
      `${item.title.slice(0, 36)}… → ${item.status}`,
      item.status === 'compliant'
        ? 'success'
        : item.status === 'non-compliant'
          ? 'danger'
          : 'warning',
    );
  });

  onChange('audit:notes', (el) => {
    const i = Number(el.dataset.index);
    const checklist = repo().get('auditChecklist');
    const item = checklist[i];
    if (!item) return;
    item.notes = (el as HTMLInputElement).value;
    repo().set('auditChecklist', checklist);
  });

  onInput('audit:search', (el) => {
    const q = (el as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll<HTMLElement>('#checklistContainer .checklist-item').forEach((it) => {
      it.style.display = (it.dataset.search ?? '').includes(q) ? '' : 'none';
    });
  });
}

export const auditFeature: Feature = {
  render(): RawHtml {
    register();
    const checklist = repo().get('auditChecklist');
    const stats = getComplianceStats(checklist);
    return html`
      <div class="page-header fade-up">
        <h1>Control Audit Checklist</h1>
        <p>Verify OCTAVE Allegro security controls and record evidence status</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('clipboard-check', 'icon'))} Audit Controls (${checklist.length})</h3>
          <div class="btn-group">
            ${button({
              label: 'Generate from Threats',
              icon: 'refresh',
              action: 'audit:generate',
              size: 'sm',
            })}
            ${button({
              label: 'Add Custom',
              icon: 'plus',
              action: 'audit:add',
              variant: 'primary',
              size: 'sm',
            })}
          </div>
        </div>
        ${checklist.length === 0
          ? emptyState({
              icon: 'clipboard-check',
              title: 'No audit items',
              message: 'Generate controls from your identified threats, or add custom checks.',
            })
          : html`
              <div class="flex flex-wrap gap-1" style="margin-bottom:14px;">
                <span class="badge badge-success"
                  >${raw(icon('check', 'icon'))} Compliant ${stats.compliant}</span
                >
                <span class="badge badge-warning">Partial ${stats.partial}</span>
                <span class="badge badge-danger">Non-Compliant ${stats.nonComp}</span>
                <span class="badge">Total ${checklist.length}</span>
              </div>
              <div style="margin-bottom:14px;">
                ${searchBox({ placeholder: 'Search controls', inputAction: 'audit:search' })}
              </div>
              <div id="checklistContainer">
                ${checklist.map(
                  (c, i) =>
                    html`<div
                      class="checklist-item"
                      data-search="${(c.title + ' ' + c.source).toLowerCase()}"
                    >
                      <div class="checklist-status">
                        <select class="form-control" data-change="audit:status" data-index="${i}">
                          ${STATUSES.map(
                            (st) =>
                              html`<option value="${st}" ${c.status === st ? raw('selected') : ''}>
                                ${STATUS_LABEL[st]}
                              </option>`,
                          )}
                        </select>
                      </div>
                      <div class="checklist-content">
                        <div class="checklist-title">${c.title}</div>
                        <div class="checklist-desc">${c.description}</div>
                        ${c.source ? html`<span class="badge badge-accent">${c.source}</span>` : ''}
                      </div>
                      <input
                        class="form-control"
                        style="width:190px;"
                        placeholder="Notes"
                        value="${c.notes}"
                        data-change="audit:notes"
                        data-index="${i}"
                      />
                    </div>`,
                )}
              </div>
            `}
      </div>
    `;
  },
};
