/** Evidence collection feature (OCTAVE module 7). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { emptyState, searchBox } from '@/ui/components';
import { onAction, onInput } from '@/ui/dom';
import { MAX_EVIDENCE_BYTES } from '@/core/constants';
import { backend } from '@/services/backend';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, confirmAction, navigate } from '../helpers';

let registered = false;

function register(): void {
  if (registered) return;
  registered = true;

  onAction('evidence:pick', () => {
    const input = document.getElementById('evFile') as HTMLInputElement | null;
    input?.click();
  });

  onAction('evidence:delete', async (el) => {
    const i = Number(el.dataset.index);
    const evidence = repo().get('evidence');
    const item = evidence[i];
    if (!item) return;
    if (!confirmAction(`Delete evidence "${item.name}"?`)) return;
    if (item.storagePath) await backend.deleteFile(item.storagePath);
    evidence.splice(i, 1);
    repo().set('evidence', evidence);
    logActivity('Evidence Deleted', item.name, 'danger');
    toast('Evidence deleted', 'warning');
    navigate('evidence');
  });

  onInput('evidence:search', (el) => {
    const q = (el as HTMLInputElement).value.toLowerCase();
    document.querySelectorAll<HTMLElement>('#evGrid .evidence-item').forEach((it) => {
      it.style.display = (it.dataset.search ?? '').includes(q) ? '' : 'none';
    });
  });
}

export async function handleEvidenceUpload(input: HTMLInputElement): Promise<void> {
  const files = input.files;
  if (!files || files.length === 0) return;
  const evidence = repo().get('evidence');
  for (const file of Array.from(files)) {
    if (file.size > MAX_EVIDENCE_BYTES) {
      toast(`${file.name} exceeds 10MB`, 'error');
      continue;
    }
    try {
      const { url, path, stored } = await backend.uploadFile(file);
      evidence.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: url,
        storagePath: path,
        stored,
        date: new Date().toLocaleDateString(),
      });
      repo().set('evidence', evidence);
      logActivity('Evidence Uploaded', `${file.name} (${stored})`, 'success');
    } catch (e) {
      toast(`Upload failed for ${file.name}: ${(e as Error).message}`, 'error');
    }
  }
  toast('Evidence uploaded');
  navigate('evidence');
}

export const evidenceFeature: Feature = {
  render(): RawHtml {
    register();
    const evidence = repo().get('evidence');
    const cloud = backend.isCloud();
    return html`
      <div class="page-header fade-up">
        <h1>Audit Evidence Collection</h1>
        <p>Upload and manage evidence supporting your control assessments</p>
      </div>
      <div class="card fade-up">
        <div class="card-header"><h3>${raw(icon('upload-cloud', 'icon'))} Upload Evidence</h3></div>
        <div class="upload-area" data-action="evidence:pick">
          <div class="upload-icon">${raw(icon('upload-cloud', 'icon-lg'))}</div>
          <p>Click to upload screenshots, policies, or configuration exports</p>
          <p class="hint">
            Images, PDF, or documents — up to 10MB each ·
            ${cloud ? 'stored in cloud' : 'stored locally'}
          </p>
        </div>
        <input
          type="file"
          id="evFile"
          class="hidden"
          accept="image/*,.pdf,.txt,.doc,.docx"
          multiple
        />
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('paperclip', 'icon'))} Evidence Gallery (${evidence.length})</h3>
        </div>
        ${evidence.length === 0
          ? emptyState({
              icon: 'paperclip',
              title: 'No evidence yet',
              message: 'Upload documents above to support your audit.',
            })
          : html`
              <div style="margin-bottom:14px;">
                ${searchBox({ placeholder: 'Search by filename', inputAction: 'evidence:search' })}
              </div>
              <div class="evidence-grid" id="evGrid">
                ${evidence.map(
                  (e, i) =>
                    html`<div class="evidence-item" data-search="${e.name.toLowerCase()}">
                      <div class="evidence-preview">
                        ${e.type.startsWith('image') && e.data
                          ? html`<img src="${e.data}" alt="" />`
                          : raw(icon(e.type.includes('pdf') ? 'file-text' : 'file-check', 'icon'))}
                      </div>
                      <div class="evidence-info">
                        <div class="evidence-name" title="${e.name}">${e.name}</div>
                        <div class="evidence-date">
                          ${e.date}${e.size ? ` · ${(e.size / 1024).toFixed(0)} KB` : ''} ·
                          <a
                            href="#"
                            data-action="evidence:delete"
                            data-index="${i}"
                            style="color:var(--danger);"
                            >Delete</a
                          >
                        </div>
                      </div>
                    </div>`,
                )}
              </div>
            `}
      </div>
    `;
  },
};
