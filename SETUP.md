# SRMAudit 2026 — Setup

SRMAudit runs in two modes:

| Mode | When | Where data lives |
|------|------|------------------|
| **Local** | No Supabase keys set | Account and data in this browser (IndexedDB). Works offline. |
| **Cloud** | Supabase keys set | Supabase Auth, a per-user table and file storage, so the data follows you across devices. |

## 1. Run it

You need Node.js 20 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

The login screen shows a **Local workspace** badge. Choose **Sign Up**, make an account,
and you are in. Everything is saved in this browser.

`npm run build` writes the static site to `dist/`. Any static host can serve it.

## 2. Cloud mode (optional)

1. Create a project at https://supabase.com (the free plan is enough).
2. In **Project Settings → API**, copy the **Project URL** and the **anon / publishable
   key**. Never use the `service_role` or secret key in this app.
3. Copy the template and fill in the two values:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Vite reads these when it starts, so restart `npm run dev`. For a deployed build, set the
   same two variables where you build it: they are baked into the bundle, which is fine
   for the anon key because row-level security protects the data.
4. In Supabase open **SQL Editor → New query**, paste all of **`schema.sql`**, and run it
   once. It creates the per-user data table (with row-level security) and a private
   `evidence` storage bucket.

   > **Already have a project set up?** Do **not** run `schema.sql` again: it starts by
   > dropping the `app_data` table, which deletes your audit data. Earlier versions
   > created the evidence bucket as **public**, so anyone with a file's link could open it.
   > To make it private, run only this:
   >
   > ```sql
   > update storage.buckets set public = false where id = 'evidence';
   > ```
   >
   > Nothing else changes. Files are opened through short-lived signed links that the app
   > creates from each file's stored path, so existing evidence keeps working. Links that
   > were copied out of the app earlier stop working, which is the point.
5. In **Authentication → Providers**, make sure **Email** is enabled. For quick testing you
   can turn off "Confirm email" so sign-up logs you in at once. Turn it back on for real use.
6. Reload the app. The login badge now reads **Cloud workspace**.

## 3. AI assistant (optional)

Without a key, the assistant answers from a built-in OWASP and OCTAVE knowledge base. For
open-ended answers, add your own key under **Settings → AI Provider**:

- **Google Gemini** keys start with `AIza` (https://aistudio.google.com/apikey)
- **OpenRouter** keys start with `sk-or-` (https://openrouter.ai/keys)

The key is stored only in your browser. When you use it, your questions go to that provider
from the browser.

## 4. A quick tour

- On the **Dashboard**, **Load Example** fills in a complete worked scenario you can edit.
- Work through the pages in order: Organization, Assets, Threats, Risk, Audit Checklist,
  Evidence, Compliance, Findings.
- On the **Risk** page, run the assessment, then set each risk's likelihood and impact.
  Generate the findings again after changing them.
- **Report** exports the assessment as a PDF.
- Switch between the light and dark theme from the sidebar or Settings.

Roles: **admin** can edit everything, **auditor** everything except the user list, and
**auditee** can only view findings and the assistant and upload evidence. Roles only change
what the interface shows; see the [Limits](README.md#limits).

## 5. Where things are

See the layout in [README.md](README.md#architecture) and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
