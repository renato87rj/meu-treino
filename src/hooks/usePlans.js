import { useCallback } from 'react';

export default function usePlans(workoutPlans, setWorkoutPlans, userId, syncPlan, syncDeletePlan, ignoreNextUpdateRef) {

  const createPlan = useCallback((name) => {
    if (!name.trim()) {
      alert('Digite um nome para a ficha');
      return false;
    }

    const plan = {
      id: Date.now(),
      name: name,
      exercises: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => [...prev, plan]);

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }

    return true;
  }, [userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const duplicatePlan = useCallback((plan) => {
    const newPlan = {
      ...plan,
      id: Date.now(),
      name: `${plan.name} (cópia)`,
      exercises: plan.exercises.map(ex => ({
        ...ex,
        id: Date.now() + Math.random()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => [...prev, newPlan]);

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(newPlan);
    }
  }, [userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const editPlanName = useCallback((planId, newName) => {
    if (!newName.trim()) {
      alert('Digite um nome para a ficha');
      return false;
    }

    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return false;

    const plan = {
      ...updatedPlan,
      name: newName,
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }

    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const deletePlan = useCallback((planId) => {
    if (confirm('Deletar esta ficha de treino?')) {
      setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));

      if (userId) {
        syncDeletePlan(planId);
      }

      return true;
    }
    return false;
  }, [userId, syncDeletePlan, setWorkoutPlans]);

  const addExercise = useCallback((planId, exerciseData) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps) {
      alert('Preencha todos os campos');
      return false;
    }

    const exercise = {
      id: Date.now(),
      name: exerciseData.name,
      sets: parseInt(exerciseData.sets),
      reps: exerciseData.reps,
      weight: exerciseData.weight ? parseFloat(exerciseData.weight) : null
    };

    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return false;

    const plan = {
      ...updatedPlan,
      exercises: [...updatedPlan.exercises, exercise],
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }

    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const editExercise = useCallback((planId, exerciseData) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps) {
      alert('Preencha todos os campos');
      return false;
    }

    const updatedExercise = {
      ...exerciseData,
      sets: parseInt(exerciseData.sets),
      reps: exerciseData.reps,
      weight: exerciseData.weight ? parseFloat(exerciseData.weight) : null
    };

    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return false;

    const plan = {
      ...updatedPlan,
      exercises: updatedPlan.exercises.map(ex =>
        ex.id === updatedExercise.id ? updatedExercise : ex
      ),
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }

    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const deleteExercise = useCallback((planId, exerciseId) => {
    if (confirm('Remover este exercício da ficha?')) {
      const updatedPlan = workoutPlans.find(p => p.id === planId);
      if (!updatedPlan) return false;

      const plan = {
        ...updatedPlan,
        exercises: updatedPlan.exercises.filter(ex => ex.id !== exerciseId),
        updatedAt: new Date().toISOString()
      };

      setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

      if (userId) {
        ignoreNextUpdateRef.current.plans = true;
        syncPlan(plan);
      }

      return true;
    }
    return false;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const duplicateExercise = useCallback((planId, exercise) => {
    const newExercise = {
      ...exercise,
      id: Date.now(),
      name: `${exercise.name} (cópia)`
    };

    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return;

    const plan = {
      ...updatedPlan,
      exercises: [...updatedPlan.exercises, newExercise],
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const moveExercise = useCallback((planId, exerciseId, direction) => {
    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return;

    const index = updatedPlan.exercises.findIndex(ex => ex.id === exerciseId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= updatedPlan.exercises.length) return;

    const newExercises = [...updatedPlan.exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];

    const plan = {
      ...updatedPlan,
      exercises: newExercises,
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const persistWeightToPlan = useCallback((planId, exerciseId, newWeight) => {
    if (newWeight == null || newWeight === '') return;
    const numWeight = parseFloat(newWeight);
    if (isNaN(numWeight)) return;

    const targetPlan = workoutPlans.find(p => p.id === planId);
    if (!targetPlan) return;

    const exerciseExists = targetPlan.exercises.find(ex => ex.id === exerciseId);
    if (!exerciseExists || exerciseExists.weight === numWeight) return;

    const updatedPlan = {
      ...targetPlan,
      exercises: targetPlan.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, weight: numWeight } : ex
      ),
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(updatedPlan);
    }
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  return {
    createPlan,
    editPlanName,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    persistWeightToPlan,
  };
}
