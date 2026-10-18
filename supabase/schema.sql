-- Crewmate: the two tables the app needs. Run this once in Supabase: SQL Editor, paste, Run. Safe to run again.
--
-- app_state    one row holding the whole app's data as JSON, with a version number. The app writes it with
--              "update ... where version = n", so two people saving at once never overwrite each other.
-- call_signals the short-lived messages that set up voice and video calls (ring, offer, answer, captions, hang up).
--
-- Row level security is switched ON with no policies, so nobody can read or write these tables with the public
-- (anon) key. Only the server, using the service key, can. Never put the service key in the browser or in git.

create table if not exists public.app_state (
  id         text primary key,
  version    bigint not null default 0,
  data       jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id) values ('main') on conflict (id) do nothing;

create table if not exists public.call_signals (
  seq        bigserial primary key,
  project_id text not null,
  from_user  text not null,
  to_user    text not null,
  type       text not null,
  payload    text not null default '',
  at         timestamptz not null default now()
);

create index if not exists call_signals_lookup on public.call_signals (project_id, to_user, seq);
create index if not exists call_signals_age on public.call_signals (at);

alter table public.app_state enable row level security;
alter table public.call_signals enable row level security;
