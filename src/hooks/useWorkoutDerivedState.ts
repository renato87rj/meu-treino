import { useMemo } from 'react';
import type { WorkoutPlan, WorkoutRecord } from '../types/workout';

export default function useWorkoutDerivedState(
  view: string,
  selectedPlan: WorkoutPlan | null,
  history: WorkoutRecord[],
  getTodayRecords: (planId: string) => WorkoutRecord[]
) {
  const todayRecords = useMemo(() => {
    if (view !== 'workout' || !selectedPlan) return [];
    return getTodayRecords(selectedPlan.id);
  }, [view, selectedPlan, getTodayRecords]);

  const completedTodayIds = useMemo(
    () => new Set<string>(todayRecords.map((r) => String(r.exerciseId))),
    [todayRecords]
  );
  const completedTodayNames = useMemo(() => new Set(todayRecords.map(r => r.exerciseName)), [todayRecords]);

  const lastWorkoutRecordsByExerciseName = useMemo(() => {
    if (view !== 'workout' || !selectedPlan) return {};

    const today = new Date().toLocaleDateString('pt-BR');
    const entries = (history || [])
      .filter(r => r.planId === selectedPlan.id)
      .filter(r => new Date(r.date).toLocaleDateString('pt-BR') !== today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const map: Record<string, WorkoutRecord> = {};
    for (const r of entries) {
      if (!r?.exerciseName) continue;
      if (!map[r.exerciseName]) map[r.exerciseName] = r;
    }
    return map;
  }, [view, selectedPlan, history]);

  return { todayRecords, completedTodayIds, completedTodayNames, lastWorkoutRecordsByExerciseName };
}
