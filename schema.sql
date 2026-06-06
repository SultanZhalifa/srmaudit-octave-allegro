-- ============================================================
-- SRMAudit 2026 — Supabase Schema  (run once in SQL Editor)
-- ------------------------------------------------------------
-- Project Settings checklist BEFORE running:
--   * Authentication -> Providers -> Email: ENABLED
--   * (Optional for quick testing) Authentication -> turn OFF
--     "Confirm email" so sign-up logs in immediately.
-- ============================================================

-- 1) Per-user key/value store for all audit data ------------
drop table if exists public.app_data;

create table public.app_data (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_data enable row level security;

drop policy if exists "own rows" on public.app_data;
create policy "own rows" on public.app_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2) Evidence storage bucket --------------------------------
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Files are stored as:  evidence/{user_id}/{timestamp}_{filename}
do $$
begin
  drop policy if exists "evidence upload own" on storage.objects;
  drop policy if exists "evidence read own"   on storage.objects;
  drop policy if exists "evidence delete own" on storage.objects;
  drop policy if exists "evidence update own" on storage.objects;
end $$;

create policy "evidence upload own" on storage.objects
  for insert with check (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence read own" on storage.objects
  for select using (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence delete own" on storage.objects
  for delete using (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence update own" on storage.objects
  for update using (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Done. Reload the app — credentials come from .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
