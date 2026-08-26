-- Cloud sync for Life 4.0
-- Run this once in the Supabase SQL editor if cloud sync is not already configured.
create table if not exists public.app_sync (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  client_id text,
  updated_at timestamptz not null default now()
);

alter table public.app_sync enable row level security;

-- This app is a single-user personal app. If you later add authentication,
-- replace these policies with auth.uid()-based policies.
create policy "app_sync_public_read"
  on public.app_sync for select
  using (true);

create policy "app_sync_public_insert"
  on public.app_sync for insert
  with check (true);

create policy "app_sync_public_update"
  on public.app_sync for update
  using (true)
  with check (true);
