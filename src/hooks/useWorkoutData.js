import { useState, useEffect } from 'react';

export default function useWorkoutData() {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedPlans = localStorage.getItem('workoutPlans');
    const savedHistory = localStorage.getItem('workoutHistory');
    
    if (savedPlans) {
      setWorkoutPlans(JSON.parse(savedPlans));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar dados automaticamente
  useEffect(() => {
    localStorage.setItem('workoutPlans', JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(history));
  }, [history]);

  // Criar ficha de treino
  const createPlan = (name) => {
    if (!name.trim()) {
      alert('Digite um nome para a ficha');
      return false;
    }

    const plan = {
      id: Date.now(),
      name: name,
      exercises: []
    };

    setWorkoutPlans([...workoutPlans, plan]);
    return true;
  };

  // Duplicar ficha
  const duplicatePlan = (plan) => {
    const newPlan = {
      id: Date.now(),
      name: `${plan.name} (cópia)`,
      exercises: plan.exercises.map(ex => ({...ex, id: Date.now() + Math.random()}))
    };
    setWorkoutPlans([...workoutPlans, newPlan]);
  };

  // Deletar ficha
  const deletePlan = (planId) => {
    if (confirm('Deletar esta ficha de treino?')) {
      setWorkoutPlans(workoutPlans.filter(plan => plan.id !== planId));
      return true;
    }
    return false;
  };

  // Adicionar exercício à ficha
  const addExercise = (planId, exerciseData) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps || !exerciseData.weight) {
      alert('Preencha todos os campos');
      return false;
    }

    const exercise = {
      id: Date.now(),
      name: exerciseData.name,
      sets: parseInt(exerciseData.sets),
      reps: parseInt(exerciseData.reps),
      weight: parseFloat(exerciseData.weight)
    };

    setWorkoutPlans(workoutPlans.map(plan => 
      plan.id === planId
        ? { ...plan, exercises: [...plan.exercises, exercise] }
        : plan
    ));

    return true;
  };

  // Editar exercício
  const editExercise = (planId, exerciseData) => {
    if (!exerciseData.name || !exerciseData.sets || !exerciseData.reps || !exerciseData.weight) {
      alert('Preencha todos os campos');
      return false;
    }

    setWorkoutPlans(workoutPlans.map(plan =>
      plan.id === planId
        ? {
            ...plan,
            exercises: plan.exercises.map(ex =>
              ex.id === exerciseData.id ? exerciseData : ex
            )
          }
        : plan
    ));
    return true;
  };

  // Deletar exercício
  const deleteExercise = (planId, exerciseId) => {
    if (confirm('Remover este exercício da ficha?')) {
      setWorkoutPlans(workoutPlans.map(plan =>
        plan.id === planId
          ? { ...plan, exercises: plan.exercises.filter(ex => ex.id !== exerciseId) }
          : plan
      ));
      return true;
    }
    return false;
  };

  // Duplicar exercício
  const duplicateExercise = (planId, exercise) => {
    const newExercise = {
      ...exercise,
      id: Date.now(),
      name: `${exercise.name} (cópia)`
    };

    setWorkoutPlans(workoutPlans.map(plan =>
      plan.id === planId
        ? { ...plan, exercises: [...plan.exercises, newExercise] }
        : plan
    ));
  };

  // Mover exercício
  const moveExercise = (planId, exerciseId, direction) => {
    setWorkoutPlans(workoutPlans.map(plan => {
      if (plan.id === planId) {
        const index = plan.exercises.findIndex(ex => ex.id === exerciseId);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= plan.exercises.length) {
          return plan;
        }

        const newExercises = [...plan.exercises];
        [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
        return { ...plan, exercises: newExercises };
      }
      return plan;
    }));
  };

  // Registrar treino
  const recordWorkout = (plan, exercise, recordData) => {
    if (!recordData.sets || !recordData.reps || !recordData.weight) {
      alert('Preencha todos os campos');
      return false;
    }

    const record = {
      id: Date.now(),
      planId: plan.id,
      planName: plan.name,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      plannedSets: exercise.sets,
      plannedReps: exercise.reps,
      plannedWeight: exercise.weight,
      actualSets: parseInt(recordData.sets),
      actualReps: parseInt(recordData.reps),
      actualWeight: parseFloat(recordData.weight),
      date: new Date().toISOString()
    };

    setHistory([record, ...history]);
    return true;
  };

  // Verificar exercícios concluídos hoje
  const getTodayRecords = (planId) => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === planId;
    });
  };

  // Agrupar histórico por data
  const groupHistoryByDate = () => {
    return history.reduce((groups, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});
  };

  return {
    workoutPlans,
    history,
    createPlan,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    recordWorkout,
    getTodayRecords,
    groupHistoryByDate
  };
}

