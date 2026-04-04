-- Etapa 7: tabelas de domínio com UUID + RLS
-- Execute no SQL Editor do Supabase ou via CLI após `supabase link`.

create extension if not exists "pgcrypto";

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plans_user_id_idx on public.workout_plans (user_id);

create table if not exists public.workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null,
  plan_name text not null,
  exercise_id text not null,
  exercise_name text not null,
  planned_sets int not null,
  planned_reps text not null,
  planned_weight numeric,
  weight numeric,
  completed_sets jsonb not null default '[]'::jsonb,
  completed boolean not null default true,
  substitute boolean default false,
  source_plan_name text,
  record_date timestamptz not null,
  duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_history_user_id_idx on public.workout_history (user_id);
create index if not exists workout_history_plan_id_idx on public.workout_history (plan_id);

alter table public.workout_plans enable row level security;
alter table public.workout_history enable row level security;

create policy "Users manage own workout_plans"
  on public.workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own workout_history"
  on public.workout_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
