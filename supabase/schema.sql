-- Run this in your Supabase SQL editor (SQL Editor → New query → paste → Run).
-- This sets up a single shared tasks table with no auth, so the publishable
-- (anon) key can read/write it directly. Anyone with your project URL + key
-- could see/edit tasks, so keep this URL private.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  due_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tasks add column if not exists sort_order int not null default 0;

create index if not exists tasks_due_idx on public.tasks (due_date);
create index if not exists tasks_completed_idx on public.tasks (completed_at);
create index if not exists tasks_sort_idx on public.tasks (due_date, sort_order);

alter table public.tasks enable row level security;

drop policy if exists "tasks_anon_all" on public.tasks;
create policy "tasks_anon_all" on public.tasks
  for all to anon
  using (true)
  with check (true);

drop policy if exists "tasks_auth_all" on public.tasks;
create policy "tasks_auth_all" on public.tasks
  for all to authenticated
  using (true)
  with check (true);

create or replace function public.roll_forward_open_tasks()
returns void
language sql
security definer
set search_path = public
as $$
  update public.tasks
     set due_date = current_date
   where completed_at is null
     and due_date < current_date;
$$;

grant execute on function public.roll_forward_open_tasks() to anon, authenticated;

-- Daily notes: a free-form text entry per calendar day.
create table if not exists public.day_notes (
  day date primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.day_notes enable row level security;

drop policy if exists "day_notes_anon_all" on public.day_notes;
create policy "day_notes_anon_all" on public.day_notes
  for all to anon
  using (true)
  with check (true);

drop policy if exists "day_notes_auth_all" on public.day_notes;
create policy "day_notes_auth_all" on public.day_notes
  for all to authenticated
  using (true)
  with check (true);

-- Optional: enable Realtime for live cross-tab/device updates.
-- Dashboard → Database → Replication → enable 'tasks' and 'day_notes'
-- under the 'supabase_realtime' publication.
