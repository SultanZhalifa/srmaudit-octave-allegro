/** Login / sign-up screen. */
import { backend } from '@/services/backend';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';

export function renderLogin(): RawHtml {
  const cloud = backend.isCloud();
  return html`
    <div class="login-screen" id="loginScreen">
      <aside class="login-brand">
        <div class="brand-top">
          <span class="brand-mark">${raw(icon('shield-check'))}</span>
          <span class="brand-name">SRMAudit 2026</span>
        </div>
        <div class="brand-hero">
          <h2>Risk-centric security audits, done the OCTAVE Allegro way.</h2>
          <p>
            A complete governance, risk and compliance workspace — from asset profiling to the final
            audit opinion.
          </p>
          <div class="brand-points">
            <div class="brand-point">
              ${raw(icon('check'))} 8-step OCTAVE Allegro engine with a live 5×5 risk heatmap
            </div>
            <div class="brand-point">
              ${raw(icon('check'))} OWASP threats mapped to ISO 27001 &amp; NIST CSF controls
            </div>
            <div class="brand-point">
              ${raw(icon('check'))} Real cloud or local persistence, evidence storage &amp; PDF
              reports
            </div>
          </div>
        </div>
        <div class="brand-foot">OCTAVE Allegro · OWASP · ISO/IEC 27001 · NIST CSF 2.0</div>
      </aside>
      <main class="login-panel">
        <div class="login-card">
          <div class="logo-sm">${raw(icon('shield-check'))}<span>SRMAudit 2026</span></div>
          <h1>Welcome</h1>
          <p class="sub">
            Sign in to your audit workspace
            <span class="badge badge-accent" style="margin-left:6px;"
              >${raw(icon(cloud ? 'database' : 'hard-drive', 'icon'))}
              ${cloud ? 'Cloud workspace' : 'Local workspace'}</span
            >
          </p>
          ${!cloud
            ? html`<div class="setup-notice">
                ${raw(icon('info', 'icon'))}
                <div>
                  Running in <strong>local mode</strong>. Your account &amp; data are stored
                  securely in this browser. To enable cloud sync, set
                  <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> — see
                  <code>SETUP.md</code>.
                </div>
              </div>`
            : ''}

          <div class="auth-tabs">
            <button id="tabSignin" class="auth-tab active" data-action="auth:tab" data-tab="signin">
              Sign In
            </button>
            <button id="tabSignup" class="auth-tab" data-action="auth:tab" data-tab="signup">
              Sign Up
            </button>
          </div>

          <form onsubmit="return false;">
            <div class="form-group" id="nameGroup" style="display:none;">
              <label>Full Name</label
              ><input class="form-control" id="loginName" placeholder="Your full name" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrap">
                ${raw(icon('mail', 'input-icon icon-sm'))}<input
                  class="form-control"
                  id="loginEmail"
                  type="email"
                  placeholder="you@example.com"
                  style="padding-left:38px;"
                />
              </div>
            </div>
            <div class="form-group">
              <label>Password</label>
              <div class="input-wrap">
                ${raw(icon('lock', 'input-icon icon-sm'))}
                <input
                  class="form-control"
                  id="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  style="padding-left:38px;padding-right:42px;"
                />
                <button type="button" class="pwd-toggle-btn" data-action="auth:togglePassword">
                  ${raw(icon('eye', 'icon'))}
                </button>
              </div>
            </div>
            <div class="form-group" id="roleGroup" style="display:none;">
              <label>Role</label>
              <select class="form-control" id="loginRole">
                <option value="admin">Admin</option>
                <option value="auditor" selected>Auditor</option>
                <option value="auditee">Auditee</option>
              </select>
            </div>
            <button
              type="submit"
              class="btn btn-primary btn-block btn-lg"
              id="authSubmitBtn"
              data-action="auth:submit"
              style="margin-top:6px;"
            >
              ${raw(icon('log-in', 'icon'))} Sign In
            </button>
            <div id="forgotRow" style="text-align:center;margin-top:14px;">
              <a href="#" data-action="auth:forgot" style="font-size:0.82rem;">Forgot password?</a>
            </div>
          </form>
        </div>
      </main>
    </div>
  `;
}
