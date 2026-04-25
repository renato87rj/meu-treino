import { useCallback } from 'react';
import type { WorkoutPlan, Exercise } from '../types/workout';
import type { MutableRefObject } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

type IgnoreRef = MutableRefObject<{ plans: boolean; history: boolean }>;

export default function usePlans(
  workoutPlans: WorkoutPlan[],
  setWorkoutPlans: React.Dispatch<React.SetStateAction<WorkoutPlan[]>>,
  userId: string | null,
  syncPlan: (plan: WorkoutPlan) => void,
  syncDeletePlan: (planId: string) => Promise<boolean>,
  ignoreNextUpdateRef: IgnoreRef
) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const createPlan = useCallback((name: string, programId = '') => {
    if (!name.trim()) {
      showToast('Digite um nome para a ficha', 'warning');
      return false;
    }

    const plan = {
      id: crypto.randomUUID(),
      programId,
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

    showToast('Ficha criada com sucesso!', 'success');
    return true;
  }, [userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef, showToast]);

  const duplicatePlan = useCallback((plan: WorkoutPlan) => {
    const newPlan = {
      ...plan,
      id: crypto.randomUUID(),
      name: `${plan.name} (cópia)`,
      exercises: plan.exercises.map(ex => ({
        ...ex,
        id: crypto.randomUUID()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => [...prev, newPlan]);

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(newPlan);
    }

    showToast('Ficha duplicada com sucesso!', 'success');
  }, [userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef, showToast]);

  const editPlanName = useCallback((planId: string, newName: string) => {
    if (!newName.trim()) {
      showToast('Digite um nome para a ficha', 'warning');
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

    showToast('Nome da ficha atualizado!', 'success');
    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef, showToast]);

  const deletePlan = async (planId: string) => {
    const confirmed = await confirm({
      title: 'Excluir ficha',
      message: 'Tem certeza que deseja excluir esta ficha? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) return false;

    if (userId) {
      const ok = await syncDeletePlan(planId);
      if (!ok) {
        showToast('Erro ao excluir ficha. Tente novamente.', 'error');
        return false;
      }
    }

    setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));
    showToast('Ficha deletada', 'info');
    return true;
  };

  const addExercise = useCallback((planId: string, exerciseData: any) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps) {
      showToast('Preencha todos os campos', 'warning');
      return false;
    }

    const exercise = {
      id: crypto.randomUUID(),
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

    showToast('Exercício adicionado!', 'success');
    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef, showToast]);

  const editExercise = useCallback((planId: string, exerciseData: any) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps) {
      showToast('Preencha todos os campos', 'warning');
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

    showToast('Exercício atualizado!', 'success');
    return true;
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef, showToast]);

  const deleteExercise = async (planId: string, exerciseId: string) => {
    const confirmed = await confirm({
      title: 'Remover exercício',
      message: 'Tem certeza que deseja remover este exercício da ficha?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) return false;

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

    showToast('Exercício removido', 'info');
    return true;
  };

  const duplicateExercise = useCallback((planId: string, exercise: Exercise) => {
    const newExercise = {
      ...exercise,
      id: crypto.randomUUID(),
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

  const moveExercise = useCallback((planId: string, exerciseId: string, direction: string) => {
    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return;

    const exercises = [...updatedPlan.exercises];
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    if (currentIndex === -1) return;

    // Calcular o novo índice baseado na direção
    let newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Validar os limites
    if (newIndex < 0 || newIndex >= exercises.length) return;

    // Remover o exercício da posição atual e inserir na nova posição
    const [movedExercise] = exercises.splice(currentIndex, 1);
    exercises.splice(newIndex, 0, movedExercise);

    const plan = {
      ...updatedPlan,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  // Nova função para movimentação direta para qualquer posição
  const moveExerciseToPosition = useCallback((planId: string, exerciseId: string, toIndex: number) => {
    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return;

    const exercises = [...updatedPlan.exercises];
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    if (currentIndex === -1 || currentIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= exercises.length) return;

    // Remover o exercício da posição atual e inserir na nova posição
    const [movedExercise] = exercises.splice(currentIndex, 1);
    exercises.splice(toIndex, 0, movedExercise);

    const plan = {
      ...updatedPlan,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    };

    setWorkoutPlans(prev => prev.map(p => p.id === planId ? plan : p));

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      syncPlan(plan);
    }
  }, [workoutPlans, userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const reorderPlans = useCallback((newOrder: WorkoutPlan[]) => {
    setWorkoutPlans(newOrder);

    if (userId) {
      ignoreNextUpdateRef.current.plans = true;
      // Sincronizar cada plano individualmente
      newOrder.forEach(plan => {
        syncPlan(plan);
      });
    }
  }, [userId, syncPlan, setWorkoutPlans, ignoreNextUpdateRef]);

  const persistWeightToPlan = useCallback((planId: string, exerciseId: string, newWeight: number | string | null) => {
    if (newWeight == null || newWeight === '') return;
    const numWeight = parseFloat(String(newWeight));
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
    moveExerciseToPosition,
    reorderPlans,
    persistWeightToPlan,
  };
}
