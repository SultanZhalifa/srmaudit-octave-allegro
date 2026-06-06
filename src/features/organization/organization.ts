/** Organization profile feature (OCTAVE module 2). */
import type { EmployeeBand, Organization, Sector, SystemType } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { emptyState, button } from '@/ui/components';
import { onAction } from '@/ui/dom';
import { calcExposure } from '@/services/engines/exposure-engine';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, navigate } from '../helpers';

const SECTORS: Sector[] = [
  'Education',
  'Healthcare',
  'Finance',
  'Government',
  'Technology',
  'Retail',
  'Manufacturing',
  'Other',
];
const EMPLOYEE_BANDS: [EmployeeBand, string][] = [
  ['1-50', '1-50 (Small)'],
  ['51-200', '51-200 (Medium)'],
  ['201-1000', '201-1000 (Large)'],
  ['1000+', '1000+ (Enterprise)'],
];
const SYSTEMS: SystemType[] = [
  'Web Application',
  'Mobile Application',
  'Internal Network',
  'Cloud Infrastructure',
  'Hybrid',
];

let registered = false;

function register(): void {
  if (registered) return;
  registered = true;
  onAction('org:save', () => {
    const name = (document.getElementById('orgName') as HTMLInputElement).value.trim();
    if (!name) {
      toast('Enter an organization name', 'error');
      return;
    }
    const org: Organization = {
      name,
      sector: (document.getElementById('orgSector') as HTMLSelectElement).value as Sector,
      employees: (document.getElementById('orgEmployees') as HTMLSelectElement)
        .value as EmployeeBand,
      system: (document.getElementById('orgSystem') as HTMLSelectElement).value as SystemType,
    };
    repo().set('organization', org);
    logActivity('Organization Saved', org.name, 'accent');
    toast('Organization saved');
    navigate('organization');
  });
}

function selectOptions(values: readonly string[], current: string | undefined): RawHtml {
  return html`${values.map(
    (v) => html`<option ${current === v ? raw('selected') : ''}>${v}</option>`,
  )}`;
}

export const organizationFeature: Feature = {
  render(): RawHtml {
    register();
    const org = repo().get('organization');
    const ex = calcExposure(org);
    return html`
      <div class="page-header fade-up">
        <h1>Organization Profile</h1>
        <p>Define your organization to determine inherent exposure</p>
      </div>
      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('building', 'icon'))} Organization Information</h3>
          </div>
          <div class="form-group">
            <label>Organization Name</label
            ><input
              class="form-control"
              id="orgName"
              value="${org.name}"
              placeholder="e.g. President University"
            />
          </div>
          <div class="form-group">
            <label>Business Sector</label
            ><select class="form-control" id="orgSector">
              ${selectOptions(SECTORS, org.sector)}
            </select>
          </div>
          <div class="form-group">
            <label>Number of Employees</label
            ><select class="form-control" id="orgEmployees">
              ${EMPLOYEE_BANDS.map(
                ([v, l]) =>
                  html`<option value="${v}" ${org.employees === v ? raw('selected') : ''}>
                    ${l}
                  </option>`,
              )}
            </select>
          </div>
          <div class="form-group">
            <label>Primary System Type</label
            ><select class="form-control" id="orgSystem">
              ${selectOptions(SYSTEMS, org.system)}
            </select>
          </div>
          ${button({
            label: 'Save Organization',
            icon: 'save',
            action: 'org:save',
            variant: 'primary',
          })}
        </div>
        <div class="card">
          <div class="card-header"><h3>${raw(icon('gauge', 'icon'))} Inherent Exposure</h3></div>
          ${org.name
            ? html`<div class="text-center" style="padding:24px 10px;">
                <div
                  style="width:64px;height:64px;margin:0 auto 14px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;background:${ex.bg};color:${ex.color};"
                >
                  ${raw(icon(ex.icon, 'icon-lg'))}
                </div>
                <div
                  style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:${ex.color};"
                >
                  ${ex.level}
                </div>
                <p style="font-size:0.85rem;margin:8px auto 16px;max-width:280px;">
                  ${ex.description}
                </p>
                <span
                  class="badge"
                  style="background:${ex.bg};color:${ex.color};font-size:0.82rem;padding:5px 14px;"
                  >Exposure score ${ex.score}/10</span
                >
              </div>`
            : emptyState({
                icon: 'building',
                title: 'No profile yet',
                message: 'Complete the organization details to calculate inherent exposure.',
              })}
        </div>
      </div>
    `;
  },
};
