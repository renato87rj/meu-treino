import { useCallback } from 'react';
import type { WorkoutPlan, Exercise, WorkoutRecord, WorkoutDraft, SetProgressMap, SubstituteExercisesMap } from '../types/workout';

export default function useWorkoutSession(
  setProgress: SetProgressMap,
  setSetProgress: React.Dispatch<React.SetStateAction<SetProgressMap>>,
  substituteExercises: SubstituteExercisesMap,
  setSubstituteExercises: React.Dispatch<React.SetStateAction<SubstituteExercisesMap>>,
  persistWeightToPlan: (planId: string, exerciseId: string, weight: number | string | null) => void,
  draft: WorkoutDraft | null,
  setDraft: React.Dispatch<React.SetStateAction<WorkoutDraft | null>>,
) {

  const updateExerciseWeight = useCallback((exerciseId: string, weight: number | string) => {
    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight: weight === '' ? '' : String(parseFloat(String(weight)) || 0),
        sets: prev[exerciseId]?.sets || []
      }
    }));
  }, [setSetProgress]);

  const confirmSet = useCallback((plan: WorkoutPlan, exercise: Exercise, setIndex: number, reps: string | number | null) => {
    const exerciseId = exercise.id;
    const current = setProgress[exerciseId] || { weight: exercise.weight, sets: [] };

    const updatedSets = [...current.sets];
    updatedSets[setIndex] = { reps: reps != null && reps !== '' ? (parseInt(String(reps)) || 0) : null };

    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: { ...current, sets: updatedSets }
    }));
    return false;
  }, [setProgress, setSetProgress]);

  const unconfirmSet = useCallback((exerciseId: string, setIndex: number) => {
    const current = setProgress[exerciseId];
    if (!current) return null;
    const reps = current.sets[setIndex]?.reps;
    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: (prev[exerciseId]?.sets || []).slice(0, setIndex)
      }
    }));
    return reps;
  }, [setProgress, setSetProgress]);

  const completeExercise = useCallback((plan: WorkoutPlan, exercise: Exercise, setsData: (string | null)[] = []) => {
    const exerciseId = exercise.id;
    const current = setProgress[exerciseId] || { weight: exercise.weight, sets: [] };

    const completedSets = Array.from({ length: exercise.sets }, (_, i) => {
      if (current.sets[i]) {
        const existingSet = current.sets[i] as any;
        return {
          reps: existingSet.reps,
          weight: existingSet.weight ?? (typeof current.weight === 'number' ? current.weight : (current.weight === '' ? null : parseFloat(current.weight)) ?? exercise.weight),
          completed: existingSet.completed ?? existingSet.reps !== null,
          timestamp: existingSet.timestamp ?? new Date().toISOString()
        };
      }
      const raw = setsData[i];
      const reps = raw != null && raw !== '' ? (parseInt(raw) || 0) : null;
      return {
        reps,
        weight: typeof current.weight === 'number' ? current.weight : (current.weight === '' ? null : parseFloat(current.weight)) ?? exercise.weight,
        completed: reps !== null,
        timestamp: new Date().toISOString()
      };
    });

    const record: WorkoutRecord = {
      id: crypto.randomUUID(),
      planId: plan.id,
      planName: plan.name,
      exerciseId: String(exercise.id),
      exerciseName: exercise.name,
      plannedSets: exercise.sets,
      plannedReps: exercise.reps,
      plannedWeight: exercise.weight,
      weight: typeof current.weight === 'number' ? current.weight : (current.weight === '' ? null : parseFloat(current.weight)) ?? exercise.weight,
      completedSets,
      completed: true,
      ...(exercise._substitute && {
        substitute: true,
        sourcePlanName: exercise._sourcePlanName || 'Avulso'
      }),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDraft(prev => {
      if (!prev) return prev;
      const existingIdx = prev.records.findIndex(
        r => r.exerciseName === exercise.name && r.planId === plan.id
      );
      const updated = existingIdx >= 0
        ? prev.records.map((r, i) => i === existingIdx ? { ...record, id: r.id, createdAt: r.createdAt } : r)
        : [...prev.records, record];
      return { ...prev, records: updated };
    });

    setSetProgress(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });

    if (!exercise._substitute) {
      persistWeightToPlan(plan.id, exercise.id, current.weight);
    }

    return true;
  }, [setProgress, setSetProgress, setDraft, persistWeightToPlan]);

  const undoExercise = useCallback((plan: WorkoutPlan, exercise: Exercise) => {
    let existingRecord: WorkoutRecord | undefined;

    setDraft(prev => {
      if (!prev) return prev;
      const found = prev.records.find(
        r => r.planId === plan.id && (r.exerciseId === exercise.id || r.exerciseName === exercise.name)
      );
      existingRecord = found;
      if (!found) return prev;
      return { ...prev, records: prev.records.filter(r => r.id !== found.id) };
    });

    setSetProgress(prev => ({
      ...prev,
      [exercise.id]: {
        weight: String(existingRecord?.weight ?? exercise.weight ?? 0),
        sets: []
      }
    }));
  }, [setDraft, setSetProgress]);

  const addSubstituteExercise = useCallback((planId: string, exercise: Exercise) => {
    setSubstituteExercises(prev => ({
      ...prev,
      [planId]: [...(prev[planId] || []), exercise]
    }));
  }, [setSubstituteExercises]);

  const removeSubstituteExercise = useCallback((planId: string, exerciseId: string) => {
    setSubstituteExercises(prev => ({
      ...prev,
      [planId]: (prev[planId] || []).filter(e => e.id !== exerciseId)
    }));
  }, [setSubstituteExercises]);

  return {
    updateExerciseWeight,
    confirmSet,
    unconfirmSet,
    completeExercise,
    undoExercise,
    addSubstituteExercise,
    removeSubstituteExercise,
  };
}
