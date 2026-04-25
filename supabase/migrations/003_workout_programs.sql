-- Tabela de programas de treino (periodização)
create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_programs enable row level security;

create policy "Users can manage their own programs"
  on public.workout_programs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_workout_programs_user_id on public.workout_programs (user_id);

-- Adicionar program_id em workout_plans (nullable para compatibilidade com dados existentes)
alter table public.workout_plans
  add column if not exists program_id uuid references public.workout_programs (id) on delete cascade;

create index idx_workout_plans_program_id on public.workout_plans (program_id);

-- Adicionar program_id e plan_id em workout_sessions
alter table public.workout_sessions
  add column if not exists program_id uuid references public.workout_programs (id) on delete set null,
  add column if not exists program_name text,
  add column if not exists plan_id uuid,
  add column if not exists plan_name text;

-- Adicionar program_id em workout_history
alter table public.workout_history
  add column if not exists program_id uuid references public.workout_programs (id) on delete set null,
  add column if not exists program_name text;
