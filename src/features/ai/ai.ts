/** AI assistant feature (OCTAVE module 10). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { escapeHtml } from '@/core/utils';
import { onAction } from '@/ui/dom';
import { hasLiveAi, callAi, knowledgeAnswer } from '@/services/ai-service';
import { PAGES } from '@/core/constants';
import type { Feature } from '../feature';

let registered = false;
let currentPageTitle = 'General';

/** Format limited markdown (**bold**, bullet dashes, newlines) into safe HTML. */
function formatMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*)$/gm, '&bull; $1')
    .replace(/\n/g, '<br>');
}

function appendMessage(role: 'user' | 'assistant', innerHtml: string): HTMLElement {
  const box = document.getElementById('aiMessages');
  const el = document.createElement('div');
  el.className = `ai-message ${role}`;
  el.innerHTML = innerHtml;
  box?.appendChild(el);
  if (box) box.scrollTop = box.scrollHeight;
  return el;
}

function knowledgeReply(query: string): string {
  const entry = knowledgeAnswer(query);
  if (entry)
    return `<strong>${escapeHtml(entry.title)}</strong><br><br>${formatMarkdown(entry.body)}`;
  return `I don't have a specific knowledge-base entry for that. Try a topic such as <strong>OCTAVE Allegro</strong>, <strong>SQL Injection</strong>, <strong>authentication</strong>, <strong>backup</strong>, <strong>encryption</strong>, or <strong>logging</strong>. For generative answers, add an API key in <a href="#" data-action="nav:settings">Settings</a>.`;
}

async function send(message: string): Promise<void> {
  const text = message.trim();
  if (!text) return;
  appendMessage('user', escapeHtml(text));

  if (hasLiveAi()) {
    const typing = appendMessage(
      'assistant',
      '<div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>',
    );
    const system = `You are an expert cybersecurity auditor assistant for the OCTAVE Allegro framework. Give clear, professional, actionable answers using markdown. The user is viewing: ${currentPageTitle}.`;
    try {
      const reply = await callAi(text, system, 2048);
      typing.innerHTML = formatMarkdown(reply);
    } catch (e) {
      typing.innerHTML = `${icon('alert-triangle', 'icon')} The AI request failed (${escapeHtml((e as Error).message)}). Falling back to the knowledge base:<br><br>${knowledgeReply(text)}`;
    }
    return;
  }
  setTimeout(() => appendMessage('assistant', knowledgeReply(text)), 250);
}

function register(): void {
  if (registered) return;
  registered = true;

  onAction('ai:send', () => {
    const input = document.getElementById('aiInput') as HTMLInputElement | null;
    if (!input) return;
    const value = input.value;
    input.value = '';
    void send(value);
  });

  onAction('ai:quick', (el) => {
    void send(el.dataset.prompt ?? '');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement)?.id === 'aiInput') {
      const input = e.target as HTMLInputElement;
      const value = input.value;
      input.value = '';
      void send(value);
    }
  });
}

const QUICK = [
  ['Explain SQL Injection', 'Explain SQL Injection risk in non-technical language.'],
  ['Backup risk', 'Why is having no backup dangerous?'],
  ['Authentication hardening', 'How do I harden weak authentication?'],
  ['Executive summary', 'Write an executive summary for my audit report.'],
  ['OCTAVE Allegro', 'Summarise the OCTAVE Allegro methodology.'],
];

export const aiFeature: Feature = {
  render(): RawHtml {
    register();
    currentPageTitle = PAGES.ai.title;
    const live = hasLiveAi();
    return html`
      <div class="page-header fade-up">
        <h1>AI Auditor Assistant</h1>
        <p>Audit guidance, vulnerability explanations, and report drafting</p>
      </div>
      ${!live
        ? html`<div class="setup-notice">
            ${raw(icon('info', 'icon'))}
            <div>
              Live AI is not configured. The assistant answers from the built-in OWASP/OCTAVE
              knowledge base. For generative answers, add an API key in
              <a href="#" data-action="nav:settings">Settings</a> (Google Gemini or OpenRouter).
            </div>
          </div>`
        : ''}
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('sparkles', 'icon'))} Assistant</h3>
          <span class="badge ${live ? 'badge-success' : 'badge-warning'}"
            >${live ? 'Live AI' : 'Knowledge base'}</span
          >
        </div>
        <div class="ai-chat">
          <div class="ai-messages" id="aiMessages">
            <div class="ai-message assistant">
              <strong>Hello.</strong> I'm your OCTAVE Allegro audit assistant. Ask me about
              vulnerabilities, controls, mitigation strategies, or report writing.
            </div>
          </div>
          <div class="ai-quick">
            ${QUICK.map(
              ([label, prompt]) =>
                html`<button class="ai-quick-btn" data-action="ai:quick" data-prompt="${prompt}">
                  ${label}
                </button>`,
            )}
          </div>
          <div class="ai-input-bar">
            <input class="form-control" id="aiInput" placeholder="Ask the assistant…" />
            <button class="btn btn-primary btn-icon" data-action="ai:send">
              ${raw(icon('send', 'icon'))}
            </button>
          </div>
        </div>
      </div>
    `;
  },
};
