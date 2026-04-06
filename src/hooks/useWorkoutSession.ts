import { useCallback } from 'react';
import type { WorkoutPlan, Exercise, WorkoutRecord, SetProgressMap, SubstituteExercisesMap } from '../types/workout';

export default function useWorkoutSession(
  setProgress: SetProgressMap,
  setSetProgress: React.Dispatch<React.SetStateAction<SetProgressMap>>,
  substituteExercises: SubstituteExercisesMap,
  setSubstituteExercises: React.Dispatch<React.SetStateAction<SubstituteExercisesMap>>,
  saveRecord: (record: WorkoutRecord) => WorkoutRecord,
  syncRecord: (record: WorkoutRecord) => void,
  persistWeightToPlan: (planId: string, exerciseId: string, weight: number | string | null) => void,
  history: WorkoutRecord[],
  setHistory: React.Dispatch<React.SetStateAction<WorkoutRecord[]>>,
  userId: string | null,
  syncDeleteHistory: (recordId: string) => void
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
        // Ensure existing set has all required properties
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

    const savedRecord = saveRecord(record);

    setSetProgress(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });

    if (!exercise._substitute) {
      persistWeightToPlan(plan.id, exercise.id, current.weight);
    }

    syncRecord(savedRecord);

    return true;
  }, [setProgress, setSetProgress, saveRecord, syncRecord, persistWeightToPlan]);

  const undoExercise = useCallback((plan: WorkoutPlan, exercise: Exercise) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const existingRecord = history.find(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      if (recordDate !== today || record.planId !== plan.id) return false;
      return record.exerciseId === exercise.id || record.exerciseName === exercise.name;
    });

    if (!existingRecord) return;

    setHistory(prev => prev.filter(r => r.id !== existingRecord.id));

    setSetProgress(prev => ({
      ...prev,
      [exercise.id]: {
        weight: String(existingRecord.weight ?? exercise.weight ?? 0),
        sets: []
      }
    }));

    if (userId) {
      syncDeleteHistory(existingRecord.id);
    }
  }, [history, setHistory, userId, syncDeleteHistory, setSetProgress]);

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
