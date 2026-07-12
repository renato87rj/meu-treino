-- Tabela de perfil atual do usuário (1 linha por usuário)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  weight_kg numeric(5,2),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users manage own profile"
  on public.user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela de histórico de medições corporais
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5,2),
  chest_cm numeric(5,1),
  waist_cm numeric(5,1),
  hip_cm numeric(5,1),
  arm_cm numeric(5,1),
  thigh_cm numeric(5,1),
  measured_at timestamptz not null default now()
);

create index if not exists body_measurements_user_date_idx on public.body_measurements (user_id, measured_at desc);

alter table public.body_measurements enable row level security;

create policy "Users manage own body_measurements"
  on public.body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
