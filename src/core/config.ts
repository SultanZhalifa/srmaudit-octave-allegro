/**
 * Application configuration, sourced from Vite environment variables.
 * See `.env.example`. Secrets never live in source — only in `.env` (gitignored)
 * or the deployment environment.
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface AiConfig {
  geminiModel: string;
  openrouterModel: string;
}

export interface AppConfig {
  appName: string;
  appYear: string;
  framework: string;
  supabase: SupabaseConfig;
  ai: AiConfig;
  /** True when valid Supabase credentials are present (cloud mode). */
  readonly cloudConfigured: boolean;
}

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const config: AppConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? 'SRMAudit',
  appYear: import.meta.env.VITE_APP_YEAR ?? '2026',
  framework: 'OCTAVE Allegro',
  supabase: { url, anonKey },
  ai: {
    geminiModel: 'gemini-2.0-flash',
    openrouterModel: 'google/gemini-2.0-flash-001',
  },
  cloudConfigured: Boolean(url) && Boolean(anonKey),
};
