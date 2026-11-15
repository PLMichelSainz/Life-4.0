-- Migración idempotente y ADITIVA: segura de correr aunque la tabla ya exista y tenga datos.
-- No borra, renombra ni recrea nada.

create table if not exists public.app_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_state enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_state' and policyname='cada usuario ve solo lo suyo') then
    create policy "cada usuario ve solo lo suyo" on public.app_state for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_state' and policyname='cada usuario inserta solo lo suyo') then
    create policy "cada usuario inserta solo lo suyo" on public.app_state for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_state' and policyname='cada usuario actualiza solo lo suyo') then
    create policy "cada usuario actualiza solo lo suyo" on public.app_state for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_state' and policyname='cada usuario borra solo lo suyo') then
    create policy "cada usuario borra solo lo suyo" on public.app_state for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='app_state') then
    alter publication supabase_realtime add table public.app_state;
  end if;
end $$;
