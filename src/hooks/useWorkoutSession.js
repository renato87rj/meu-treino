import { useCallback } from 'react';

export default function useWorkoutSession(setProgress, setSetProgress, substituteExercises, setSubstituteExercises, saveRecord, syncRecord, persistWeightToPlan) {

  const updateExerciseWeight = useCallback((exerciseId, weight) => {
    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight: weight === '' ? '' : parseFloat(weight) || 0,
        sets: prev[exerciseId]?.sets || []
      }
    }));
  }, [setSetProgress]);

  const confirmSet = useCallback((plan, exercise, setIndex, reps) => {
    const exerciseId = exercise.id;
    const current = setProgress[exerciseId] || { weight: exercise.weight, sets: [] };

    const updatedSets = [...current.sets];
    updatedSets[setIndex] = { reps: reps != null && reps !== '' ? (parseInt(reps) || 0) : null };

    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: { ...current, sets: updatedSets }
    }));
    return false;
  }, [setProgress, setSetProgress]);

  const unconfirmSet = useCallback((exerciseId, setIndex) => {
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

  const completeExercise = useCallback((plan, exercise, setsData = []) => {
    const exerciseId = exercise.id;
    const current = setProgress[exerciseId] || { weight: exercise.weight, sets: [] };

    const completedSets = Array.from({ length: exercise.sets }, (_, i) => {
      if (current.sets[i]) return current.sets[i];
      const raw = setsData[i];
      const reps = raw != null && raw !== '' ? (parseInt(raw) || 0) : null;
      return { reps };
    });

    const record = {
      id: Date.now(),
      planId: plan.id,
      planName: plan.name,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      plannedSets: exercise.sets,
      plannedReps: exercise.reps,
      plannedWeight: exercise.weight,
      weight: current.weight ?? exercise.weight,
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

  const undoExercise = useCallback((plan, exercise, history, setHistory, userId, syncDeleteHistory) => {
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
        weight: existingRecord.weight ?? exercise.weight,
        sets: []
      }
    }));

    if (userId) {
      syncDeleteHistory(existingRecord.id);
    }
  }, [setSetProgress]);

  const addSubstituteExercise = useCallback((planId, exercise) => {
    setSubstituteExercises(prev => ({
      ...prev,
      [planId]: [...(prev[planId] || []), exercise]
    }));
  }, [setSubstituteExercises]);

  const removeSubstituteExercise = useCallback((planId, exerciseId) => {
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
