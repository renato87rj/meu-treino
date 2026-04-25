-- Migration: Criar programa padrão e vincular fichas existentes
-- Isso garante compatibilidade com dados antigos (fichas sem programa)

-- Criar programa "Meus Treinos" para cada usuário que tem fichas sem programa
INSERT INTO workout_programs (id, user_id, name, active, archived, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  wp.user_id,
  'Meus Treinos',
  true,  -- ativo por padrão
  false, -- não arquivado
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT user_id 
  FROM workout_plans 
  WHERE program_id IS NULL
) wp
ON CONFLICT DO NOTHING;

-- Vincular fichas sem programa ao programa "Meus Treinos" criado
UPDATE workout_plans
SET program_id = (
  SELECT id 
  FROM workout_programs 
  WHERE workout_programs.user_id = workout_plans.user_id 
    AND workout_programs.name = 'Meus Treinos'
    AND workout_programs.archived = false
  LIMIT 1
)
WHERE program_id IS NULL;
