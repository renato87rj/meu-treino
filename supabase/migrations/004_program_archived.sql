-- Adicionar coluna archived em workout_programs
alter table public.workout_programs
  add column if not exists archived boolean not null default false;
