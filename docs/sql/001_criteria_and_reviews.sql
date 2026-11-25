-- Run once in the Supabase SQL Editor.
alter table public.exercises add column if not exists criteria jsonb not null default '[]'::jsonb;

alter table public.sessions add column if not exists exercise_id uuid references public.exercises(id) on delete set null;
alter table public.sessions add column if not exists metrics jsonb;
alter table public.sessions add column if not exists criteria_results jsonb;
alter table public.sessions add column if not exists ai_observations jsonb;

create table if not exists public.session_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  plan text,
  reviewed_at timestamptz not null default now()
);
alter table public.session_reviews enable row level security;
create policy "admin reads reviews" on public.session_reviews for select using (public.is_admin());
create policy "admin writes reviews" on public.session_reviews for insert with check (public.is_admin());
create policy "admin edits reviews" on public.session_reviews for update using (public.is_admin()) with check (public.is_admin());
create policy "admin deletes reviews" on public.session_reviews for delete using (public.is_admin());
