create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_ids jsonb not null default '[]'::jsonb,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_minutes int not null,
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_workout_sessions_user_id on public.workout_sessions (user_id);
create index idx_workout_sessions_finished_at on public.workout_sessions (finished_at desc);
