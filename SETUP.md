# SRMAudit 2026 — Setup Guide

An enterprise GRC & audit platform built on the **OCTAVE Allegro** risk-assessment
methodology. It runs as static files — no build step, no server framework.

The app works in **two real modes**:

| Mode | When | Where data lives |
|------|------|------------------|
| **Local** | No Supabase keys in `config.js` | Real account + data in this browser (IndexedDB). Fully functional offline. |
| **Cloud** | Valid Supabase keys in `config.js` | Supabase Auth + per-user database + evidence storage, synced across devices. |

> **Status for this project:** Cloud is already configured in `config.js` for the
> `SRMAudit` Supabase project (`dpcxttiemhveyssekdmr`). Auth and the connection are
> verified working. The **only remaining step is running `schema.sql` once** (Step 2
> below) so the database table and evidence bucket exist.

---

## 1. Run the app

Because the app loads JS modules, open it through a local web server (not `file://`):

```powershell
# From the project folder
python -m http.server 5500
# then open  http://localhost:5500
```

(Any static server works — VS Code "Live Server", `npx serve`, etc.)

On first load you'll see the login screen with a **Local workspace** badge. Click
**Sign Up**, create an account, and you're in. All data persists in this browser.

---

## 2. (Recommended) Connect a new Supabase project for cloud sync

You lost your old Supabase account — no problem. Create a fresh free one:

1. Go to **https://supabase.com/dashboard** and sign in (GitHub/Google/email).
2. **New project** → give it a name, set a database password, pick a region, create.
3. Wait ~1 minute for it to provision.
4. In the project, open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon / public** key (the long `eyJ...` key — *not* the service role key)
5. Open **`config.js`** in this project and paste them in:

   ```js
   supabase: {
     url: 'https://abcd1234.supabase.co',
     anonKey: 'eyJhbGciOiJ...your-anon-key...'
   }
   ```

6. In Supabase, open **SQL Editor → New query**, paste the entire contents of
   **`schema.sql`**, and click **Run**. This creates the per-user data table
   (with row-level security) and the evidence storage bucket.

7. In **Authentication → Providers**, make sure **Email** is enabled.
   For quick testing you can turn **off** "Confirm email" so sign-up logs you in
   immediately (turn it back on for production).

8. Reload the app. The login badge now reads **Cloud workspace**. Sign up — your
   account and data now live in Supabase and sync across devices.

---

## 3. (Optional) Enable live AI

The AI Assistant works out of the box from a built-in **OWASP / OCTAVE knowledge
base** (real reference material — no made-up answers). For open-ended, generative
responses, add your own API key:

1. Sign in → **Settings → AI Provider**.
2. Paste a key. The provider is auto-detected:
   - **Google Gemini** keys start with `AIza…` (https://aistudio.google.com/apikey)
   - **OpenRouter** keys start with `sk-or-…` (https://openrouter.ai/keys)
3. Save. The key is stored **only in your browser** and is never synced or shared.

---

## 4. Project structure

```
index.html         App shell (login, sidebar, topbar, modal)
config.js          >> EDIT THIS << Supabase keys + branding
style.css          Warm-tone enterprise design system (light + dark)
supabase.js        Backend facade: Supabase (cloud) OR IndexedDB (local)
app.js             Core app, routing, RBAC, dashboard, settings, pages
modules.js         CRUD, AI, PDF report, example dataset
data/icons.js      Inline SVG icon library (zero emoji)
data/owasp-vulns.js  OWASP catalogue + ISO/NIST mapping + AI knowledge base
schema.sql         Run once in Supabase SQL Editor
```

---

## 5. Quick tour

- **Dashboard** → "Load Example" populates a complete worked scenario.
- Work the **8-step OCTAVE Allegro** flow: Organization → Assets → Threats →
  Risk → Audit Checklist → Evidence → Compliance → Findings.
- **Report Generator** exports a full PDF audit report with a final opinion.
- Toggle **light / dark** warm theme from the sidebar footer or Settings.

Roles: **Admin** (full), **Auditor** (audit functions), **Auditee** (view + evidence).
