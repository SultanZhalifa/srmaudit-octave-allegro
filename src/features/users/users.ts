/** User management feature (OCTAVE module 1). */
import type { Role, WorkspaceUser } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { iconButton, searchBox, button } from '@/ui/components';
import { onAction, onInput, inputValue } from '@/ui/dom';
import { openModal, closeModal } from '@/ui/modal';
import { isValidEmail } from '@/core/utils';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, confirmAction, navigate } from '../helpers';

const ROLES: Role[] = ['admin', 'auditor', 'auditee'];
let registered = false;

function userForm(u?: WorkspaceUser): RawHtml {
  return html`
    <div class="form-group">
      <label>Full Name</label
      ><input class="form-control" id="uName" value="${u?.name ?? ''}" placeholder="Jane Auditor" />
    </div>
    <div class="form-group">
      <label>Email</label
      ><input
        class="form-control"
        id="uEmail"
        value="${u?.email ?? ''}"
        placeholder="jane@example.com"
      />
    </div>
    <div class="form-group">
      <label>Role</label
      ><select class="form-control" id="uRole">
        ${ROLES.map(
          (r) =>
            html`<option value="${r}" ${u?.role === r ? raw('selected') : ''}>
              ${r.charAt(0).toUpperCase() + r.slice(1)}
            </option>`,
        )}
      </select>
    </div>
    ${u
      ? html`<div class="form-group">
          <label>Status</label
          ><select class="form-control" id="uActive">
            <option value="true" ${u.active ? raw('selected') : ''}>Active</option>
            <option value="false" ${!u.active ? raw('selected') : ''}>Inactive</option>
          </select>
        </div>`
      : ''}
  `;
}

function register(): void {
  if (registered) return;
  registered = true;

  onAction('user:add', () => {
    openModal({
      title: 'Add User',
      body: userForm(),
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Save User',
        icon: 'save',
        action: 'user:save',
        variant: 'primary',
      })}`,
    });
  });

  onAction('user:save', () => {
    const name = inputValue('uName');
    const email = inputValue('uEmail');
    const role = inputValue('uRole') as Role;
    if (!name || !email) return toast('Name and email are required', 'error');
    if (!isValidEmail(email)) return toast('Invalid email format', 'error');
    const users = repo().get('users');
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return toast('Email already exists', 'error');
    users.push({ name, email, role, active: true });
    repo().set('users', users);
    logActivity('User Added', `${name} (${role})`, 'success');
    closeModal();
    toast('User added');
    navigate('users');
  });

  onAction('user:edit', (el) => {
    const i = Number(el.dataset.index);
    const u = repo().get('users')[i];
    if (!u) return;
    openModal({
      title: 'Edit User',
      body: userForm(u),
      footer: html`${button({ label: 'Cancel', action: 'modal:close' })}${button({
        label: 'Update',
        icon: 'save',
        action: 'user:update',
        variant: 'primary',
        attrs: `data-index="${i}"`,
      })}`,
    });
  });

  onAction('user:update', (el) => {
    const i = Number(el.dataset.index);
    const name = inputValue('uName');
    const email = inputValue('uEmail');
    if (!name || !email) return toast('Name and email are required', 'error');
    if (!isValidEmail(email)) return toast('Invalid email format', 'error');
    const users = repo().get('users');
    if (users.some((u, idx) => u.email.toLowerCase() === email.toLowerCase() && idx !== i))
      return toast('Email already exists', 'error');
    const current = users[i];
    if (!current) return;
    users[i] = {
      ...current,
      name,
      email,
      role: inputValue('uRole') as Role,
      active: inputValue('uActive') === 'true',
    };
    repo().set('users', users);
    logActivity('User Updated', name, 'info');
    closeModal();
    toast('User updated');
    navigate('users');
  });

  onAction('user:delete', (el) => {
    const i = Number(el.dataset.index);
    const users = repo().get('users');
    const u = users[i];
    if (!u) return;
    if (u.system) return toast('The primary administrator cannot be removed', 'warning');
    if (!confirmAction(`Delete user "${u.name}"?`)) return;
    users.splice(i, 1);
    repo().set('users', users);
    logActivity('User Deleted', u.name, 'danger');
    toast('User deleted', 'warning');
    navigate('users');
  });

  onInput('user:search', (el) => {
    const q = (el as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll<HTMLElement>('#userTable tbody tr').forEach((row) => {
      row.style.display = (row.dataset.search ?? '').includes(q) ? '' : 'none';
    });
  });
}

export const usersFeature: Feature = {
  render(): RawHtml {
    register();
    const users = repo().get('users');
    return html`
      <div class="page-header fade-up">
        <h1>User &amp; Auditor Management</h1>
        <p>Manage workspace users, roles, and audit assignments</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('users', 'icon'))} Users (${users.length})</h3>
          <div class="flex gap-1">
            ${searchBox({
              placeholder: 'Search users',
              inputAction: 'user:search',
              width: '200px',
            })}
            ${button({
              label: 'Add User',
              icon: 'user-plus',
              action: 'user:add',
              variant: 'primary',
              size: 'sm',
            })}
          </div>
        </div>
        <div class="table-container">
          <table id="userTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(
                (u, i) =>
                  html`<tr data-search="${(u.name + ' ' + u.email + ' ' + u.role).toLowerCase()}">
                    <td>
                      <div class="flex items-center gap-1">
                        <div class="user-avatar" style="width:28px;height:28px;font-size:0.72rem;">
                          ${(u.name || '?').charAt(0)}
                        </div>
                        <strong>${u.name}</strong>
                      </div>
                    </td>
                    <td>${u.email || '—'}</td>
                    <td><span class="badge badge-accent">${u.role}</span></td>
                    <td>
                      <span class="badge ${u.active ? 'badge-success' : 'badge-danger'}"
                        >${u.active ? 'Active' : 'Inactive'}</span
                      >
                    </td>
                    <td>
                      <div class="cell-actions">
                        ${iconButton({
                          icon: 'edit',
                          action: 'user:edit',
                          tooltip: 'Edit',
                          attrs: `data-index="${i}"`,
                        })}
                        ${u.system
                          ? ''
                          : iconButton({
                              icon: 'trash',
                              action: 'user:delete',
                              tooltip: 'Delete',
                              attrs: `data-index="${i}"`,
                            })}
                      </div>
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};
