'use server';

import { createClient } from '@/lib/supabase/server';
import type { WorkoutPlan, WorkoutRecord, Exercise, CompletedSet } from '@/types/workout';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

function rowToPlan(row: {
  id: string;
  name: string;
  exercises: unknown;
  created_at: string;
  updated_at: string;
}): WorkoutPlan {
  return {
    id: row.id,
    name: row.name,
    exercises: row.exercises as Exercise[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRecord(row: {
  id: string;
  plan_id: string;
  plan_name: string;
  exercise_id: string;
  exercise_name: string;
  planned_sets: number;
  planned_reps: string;
  planned_weight: number | null;
  weight: number | null;
  completed_sets: unknown;
  completed: boolean;
  substitute: boolean | null;
  source_plan_name: string | null;
  record_date: string;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}): WorkoutRecord {
  return {
    id: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    plannedSets: row.planned_sets,
    plannedReps: row.planned_reps,
    plannedWeight: row.planned_weight,
    weight: row.weight,
    completedSets: row.completed_sets as CompletedSet[],
    completed: row.completed,
    substitute: row.substitute ?? undefined,
    sourcePlanName: row.source_plan_name ?? undefined,
    date: row.record_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    durationMinutes: row.duration_minutes ?? undefined,
  };
}

export async function loadWorkoutPlansAction(): Promise<WorkoutPlan[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('workout_plans')
    .select('id,name,exercises,created_at,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('loadWorkoutPlansAction', error);
    throw error;
  }
  return (data ?? []).map(rowToPlan);
}

export async function loadWorkoutHistoryAction(): Promise<WorkoutRecord[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('workout_history')
    .select(
      'id,plan_id,plan_name,exercise_id,exercise_name,planned_sets,planned_reps,planned_weight,weight,completed_sets,completed,substitute,source_plan_name,record_date,duration_minutes,created_at,updated_at'
    )
    .eq('user_id', user.id)
    .order('record_date', { ascending: false });

  if (error) {
    console.error('loadWorkoutHistoryAction', error);
    throw error;
  }
  return (data ?? []).map(rowToRecord);
}

export async function upsertWorkoutPlanAction(plan: WorkoutPlan): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('workout_plans').upsert(
    {
      id: plan.id,
      user_id: user.id,
      name: plan.name,
      exercises: plan.exercises,
      created_at: plan.createdAt,
      updated_at: plan.updatedAt,
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('upsertWorkoutPlanAction', error);
    throw error;
  }
}

export async function deleteWorkoutPlanAction(planId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id);
  if (error) {
    console.error('deleteWorkoutPlanAction', error);
    throw error;
  }
}

export async function upsertWorkoutHistoryAction(record: WorkoutRecord): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from('workout_history').upsert(
    {
      id: record.id,
      user_id: user.id,
      plan_id: record.planId,
      plan_name: record.planName,
      exercise_id: record.exerciseId,
      exercise_name: record.exerciseName,
      planned_sets: record.plannedSets,
      planned_reps: record.plannedReps,
      planned_weight: record.plannedWeight,
      weight: record.weight,
      completed_sets: record.completedSets,
      completed: record.completed,
      substitute: record.substitute ?? false,
      source_plan_name: record.sourcePlanName ?? null,
      record_date: record.date,
      duration_minutes: record.durationMinutes ?? null,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.error('upsertWorkoutHistoryAction', error);
    throw error;
  }
}

export async function deleteWorkoutHistoryAction(recordId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from('workout_history')
    .delete()
    .eq('id', recordId)
    .eq('user_id', user.id);
  if (error) {
    console.error('deleteWorkoutHistoryAction', error);
    throw error;
  }
}

export async function syncAllDataAction(
  workoutPlans: WorkoutPlan[],
  history: WorkoutRecord[]
): Promise<void> {
  const { supabase, user } = await requireUser();

  for (const plan of workoutPlans) {
    const { error } = await supabase.from('workout_plans').upsert(
      {
        id: plan.id,
        user_id: user.id,
        name: plan.name,
        exercises: plan.exercises,
        created_at: plan.createdAt,
        updated_at: plan.updatedAt,
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  for (const record of history) {
    const { error } = await supabase.from('workout_history').upsert(
      {
        id: record.id,
        user_id: user.id,
        plan_id: record.planId,
        plan_name: record.planName,
        exercise_id: record.exerciseId,
        exercise_name: record.exerciseName,
        planned_sets: record.plannedSets,
        planned_reps: record.plannedReps,
        planned_weight: record.plannedWeight,
        weight: record.weight,
        completed_sets: record.completedSets,
        completed: record.completed,
        substitute: record.substitute ?? false,
        source_plan_name: record.sourcePlanName ?? null,
        record_date: record.date,
        duration_minutes: record.durationMinutes ?? null,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }
}
