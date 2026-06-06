/** Asset inventory feature (OCTAVE module 3) — assets and containers. */
import type { Asset, AssetLocation, AssetType, CiaLevel } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { iconButton, searchBox, button, emptyState } from '@/ui/components';
import { onAction, onInput, inputValue } from '@/ui/dom';
import { openModal, closeModal } from '@/ui/modal';
import { calcCriticality } from '@/services/engines/risk-engine';
import { CONTAINER_TYPES } from '@/data/octave-reference';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, confirmAction, navigate } from '../helpers';

const TYPES: AssetType[] = ['Application', 'Server', 'Data', 'Network', 'Endpoint'];
const LOCATIONS: AssetLocation[] = ['Cloud Server', 'On-Premise', 'Hybrid', 'Third-Party'];
const CIA: CiaLevel[] = ['High', 'Medium', 'Low'];
let registered = false;

function opts(values: readonly string[], current: string | undefined): RawHtml {
  return html`${values.map(
    (v) => html`<option ${current === v ? raw('selected') : ''}>${v}</option>`,
  )}`;
}

function assetForm(a?: Asset): RawHtml {
  return html`
    <div class="grid-2">
      <div class="form-group">
        <label>Asset Name</label
        ><input
          class="form-control"
          id="aName"
          value="${a?.name ?? ''}"
          placeholder="e.g. Student Database"
        />
      </div>
      <div class="form-group">
        <label>Owner</label
        ><input
          class="form-control"
          id="aOwner"
          value="${a?.owner ?? ''}"
          placeholder="e.g. IT Department"
        />
      </div>
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label>Type</label
        ><select class="form-control" id="aType">
          ${opts(TYPES, a?.type)}
        </select>
      </div>
      <div class="form-group">
        <label>Location</label
        ><select class="form-control" id="aLocation">
          ${opts(LOCATIONS, a?.location)}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Description</label
      ><textarea class="form-control" id="aDesc" rows="2" placeholder="Brief description…">
${a?.description ?? ''}</textarea
      >
    </div>
    <div class="grid-3">
      <div class="form-group">
        <label>Confidentiality</label
        ><select class="form-control" id="aC">
          ${opts(CIA, a?.confidentiality ?? 'Medium')}
        </select>
      </div>
      <div class="form-group">
        <label>Integrity</label
        ><select class="form-control" id="aI">
          ${opts(CIA, a?.integrity ?? 'Medium')}
        </select>
      </div>
      <div class="form-group">
        <label>Availability</label
        ><select class="form-control" id="aA">
          ${opts(CIA, a?.availability ?? 'Medium')}
        </select>
      </div>
    </div>
  `;
}

function readForm(): Omit<Asset, 'containers'> {
  return {
    name: inputValue('aName'),
    owner: inputValue('aOwner'),
    type: inputValue('aType') as AssetType,
    location: inputValue('aLocation') as AssetLocation,
    description: inputValue('aDesc'),
    confidentiality: inputValue('aC') as CiaLevel,
    integrity: inputValue('aI') as CiaLevel,
    availability: inputValue('aA') as CiaLevel,
  };
}

function register(): void {
  if (registered) return;
  registered = true;

  onAction('asset:add', () => {
    openModal({
      title: 'Add Information Asset',
      large: true,
      body: assetForm(),
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Save Asset',
        icon: 'save',
        action: 'asset:save',
        variant: 'primary',
      })}`,
    });
  });

  onAction('asset:save', () => {
    const form = readForm();
    if (!form.name || !form.owner) return toast('Asset name and owner are required', 'error');
    const assets = repo().get('assets');
    if (assets.some((a) => a.name.toLowerCase() === form.name.toLowerCase()))
      return toast('An asset with this name already exists', 'error');
    assets.push({ ...form, containers: [] });
    repo().set('assets', assets);
    logActivity('Asset Added', form.name, 'success');
    closeModal();
    toast('Asset added');
    navigate('assets');
  });

  onAction('asset:edit', (el) => {
    const i = Number(el.dataset.index);
    const a = repo().get('assets')[i];
    if (!a) return;
    openModal({
      title: 'Edit Asset',
      large: true,
      body: assetForm(a),
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Update',
        icon: 'save',
        action: 'asset:update',
        variant: 'primary',
        attrs: `data-index="${i}"`,
      })}`,
    });
  });

  onAction('asset:update', (el) => {
    const i = Number(el.dataset.index);
    const form = readForm();
    if (!form.name || !form.owner) return toast('Asset name and owner are required', 'error');
    const assets = repo().get('assets');
    if (assets.some((a, idx) => a.name.toLowerCase() === form.name.toLowerCase() && idx !== i))
      return toast('An asset with this name already exists', 'error');
    const current = assets[i];
    if (!current) return;
    assets[i] = { ...current, ...form };
    repo().set('assets', assets);
    logActivity('Asset Updated', form.name, 'info');
    closeModal();
    toast('Asset updated');
    navigate('assets');
  });

  onAction('asset:delete', (el) => {
    const i = Number(el.dataset.index);
    const assets = repo().get('assets');
    const a = assets[i];
    if (!a) return;
    if (!confirmAction(`Delete asset "${a.name}"? Its threat mappings will also be removed.`))
      return;
    const threats = repo().get('assetThreats');
    delete threats[a.name];
    repo().set('assetThreats', threats);
    assets.splice(i, 1);
    repo().set('assets', assets);
    logActivity('Asset Deleted', a.name, 'danger');
    toast('Asset deleted', 'warning');
    navigate('assets');
  });

  onAction('asset:containers', (el) => {
    const i = Number(el.dataset.index);
    const a = repo().get('assets')[i];
    if (!a) return;
    openModal({
      title: `Asset Containers — ${a.name}`,
      large: true,
      body: html`
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">
          OCTAVE Allegro Step 3 — identify where this asset is stored, transported, or processed.
        </p>
        ${CONTAINER_TYPES.map(
          (ct) => html`
            <div class="check-group-title">${ct.name} Containers</div>
            ${ct.examples.map(
              (ex) =>
                html`<label class="check-row"
                  ><input
                    type="checkbox"
                    value="${ex}"
                    ${a.containers.includes(ex) ? raw('checked') : ''}
                  /><span>${ex}</span></label
                >`,
            )}
          `,
        )}
      `,
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Save',
        icon: 'save',
        action: 'asset:saveContainers',
        variant: 'primary',
        attrs: `data-index="${i}"`,
      })}`,
    });
  });

  onAction('asset:saveContainers', (el) => {
    const i = Number(el.dataset.index);
    const assets = repo().get('assets');
    const a = assets[i];
    if (!a) return;
    a.containers = Array.from(
      document.querySelectorAll<HTMLInputElement>('.modal-body input:checked'),
    ).map((c) => c.value);
    repo().set('assets', assets);
    closeModal();
    toast('Containers updated');
    navigate('assets');
  });

  onInput('asset:search', (el) => {
    const q = (el as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll<HTMLElement>('#assetTable tbody tr').forEach((row) => {
      row.style.display = (row.dataset.search ?? '').includes(q) ? '' : 'none';
    });
  });
}

function ciaBadge(v: CiaLevel): RawHtml {
  const variant = v === 'High' ? 'danger' : v === 'Medium' ? 'warning' : 'low';
  return html`<span class="badge badge-${variant}">${v[0]}</span>`;
}

export const assetsFeature: Feature = {
  render(): RawHtml {
    register();
    const assets = repo().get('assets');
    return html`
      <div class="page-header fade-up">
        <h1>Asset Inventory</h1>
        <p>OCTAVE Allegro Steps 2 &amp; 3 — register information assets and identify containers</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('boxes', 'icon'))} Information Assets (${assets.length})</h3>
          <div class="flex gap-1">
            ${searchBox({
              placeholder: 'Search assets',
              inputAction: 'asset:search',
              width: '200px',
            })}
            ${button({
              label: 'Add Asset',
              icon: 'plus',
              action: 'asset:add',
              variant: 'primary',
              size: 'sm',
            })}
          </div>
        </div>
        ${assets.length === 0
          ? emptyState({
              icon: 'boxes',
              title: 'No assets registered',
              message: 'Add information assets to begin the risk assessment.',
            })
          : html`<div class="table-container">
              <table id="assetTable">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>C</th>
                    <th>I</th>
                    <th>A</th>
                    <th>Criticality</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${assets.map((a, i) => {
                    const cr = calcCriticality(a);
                    return html`<tr
                      data-search="${(
                        a.name +
                        ' ' +
                        a.owner +
                        ' ' +
                        a.type +
                        ' ' +
                        a.description
                      ).toLowerCase()}"
                    >
                      <td>
                        <strong>${a.name}</strong>${a.description
                          ? html`<br /><span style="font-size:0.74rem;color:var(--text-muted);"
                                >${a.description.slice(0, 56)}${a.description.length > 56
                                  ? '…'
                                  : ''}</span
                              >`
                          : ''}
                      </td>
                      <td>${a.owner}</td>
                      <td><span class="badge">${a.type}</span></td>
                      <td>${ciaBadge(a.confidentiality)}</td>
                      <td>${ciaBadge(a.integrity)}</td>
                      <td>${ciaBadge(a.availability)}</td>
                      <td>
                        <span class="badge badge-${cr.level.toLowerCase()}"
                          >${cr.level} (${cr.score})</span
                        >
                      </td>
                      <td>
                        <div class="cell-actions">
                          ${iconButton({
                            icon: 'edit',
                            action: 'asset:edit',
                            tooltip: 'Edit',
                            attrs: `data-index="${i}"`,
                          })}
                          ${iconButton({
                            icon: 'layers',
                            action: 'asset:containers',
                            tooltip: 'Containers',
                            attrs: `data-index="${i}"`,
                          })}
                          ${iconButton({
                            icon: 'trash',
                            action: 'asset:delete',
                            tooltip: 'Delete',
                            attrs: `data-index="${i}"`,
                          })}
                        </div>
                      </td>
                    </tr>`;
                  })}
                </tbody>
              </table>
            </div>`}
      </div>
    `;
  },
};
