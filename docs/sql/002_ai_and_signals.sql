-- Run once in the Supabase SQL Editor, after 001.
alter table public.session_reviews add column if not exists ai_feedback jsonb;

-- The patient's browser asks the server to analyse pictures; the server stores the answer through this
-- function. It only writes the caller's own session, and only once.
create or replace function public.set_ai_observations(p_session_id uuid, p_obs jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.sessions set ai_observations = p_obs
  where id = p_session_id and patient_id = auth.uid() and ai_observations is null;
  if not found then raise exception 'Session not found, not yours, or already analysed'; end if;
end;
$$;
revoke all on function public.set_ai_observations(uuid, jsonb) from public;
grant execute on function public.set_ai_observations(uuid, jsonb) to authenticated;

-- Signals recorded together with a session (real hardware, later). All series start at session time 0
-- and are sampled at fs. Example series keys: emg_l, emg_r, eeg_mu_l, eeg_mu_r, eeg_beta_l, eeg_beta_r.
create table if not exists public.session_signals (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null default 'device' check (source_type in ('device','replay')),
  fs numeric not null,
  series jsonb not null,
  events jsonb,
  created_at timestamptz not null default now()
);
alter table public.session_signals enable row level security;
create policy "read own signals or admin" on public.session_signals
  for select using (patient_id = auth.uid() or public.is_admin());
create policy "admin writes signals" on public.session_signals
  for insert with check (public.is_admin());
