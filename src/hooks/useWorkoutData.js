import { useState, useEffect, useCallback, useRef } from 'react';
import useFirestoreSync from './useFirestoreSync';
import { hasPendingOperations } from '../utils/syncQueue';

/**
 * Hook para gerenciar dados de treino com sincronização Firebase + localStorage
 * @param {string} userId - ID do usuário autenticado
 */
export default function useWorkoutData(userId = null) {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Progresso parcial das séries durante o treino
  // Formato: { [exerciseId]: { weight: number, sets: [{ reps: number }, ...] } }
  const [setProgress, setSetProgress] = useState({});

  // Exercícios substitutos adicionados por plano
  // Formato: { [planId]: [ { id, name, sets, reps, weight, _substitute, _sourcePlanName, ... } ] }
  const [substituteExercises, setSubstituteExercises] = useState({});

  const isSyncingRef = useRef(false);
  const lastLocalUpdateRef = useRef(null);
  const ignoreNextUpdateRef = useRef({ plans: false, history: false });

  // Hook de sincronização Firebase
  const {
    isSyncing,
    syncError,
    lastSyncedAt,
    isInitialSync,
    checkIfFirstSync,
    syncLocalToFirestore,
    syncPlan,
    syncDeletePlan,
    syncHistory,
    syncDeleteHistory,
    setupRealtimeListeners,
    cleanupListeners,
    processSyncQueue
  } = useFirestoreSync(userId, isOnline);

  // Detectar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    if (isInitialized) return;

    const savedPlans = localStorage.getItem('workoutPlans');
    const savedHistory = localStorage.getItem('workoutHistory');
    const savedSetProgress = localStorage.getItem('workoutSetProgress');

    if (savedPlans) {
      try {
        setWorkoutPlans(JSON.parse(savedPlans));
      } catch (error) {
        console.error('Erro ao carregar planos do localStorage:', error);
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Erro ao carregar histórico do localStorage:', error);
      }
    }
    if (savedSetProgress) {
      try {
        const parsed = JSON.parse(savedSetProgress);
        // Só restaura se for do dia de hoje
        if (parsed.date === new Date().toLocaleDateString('pt-BR')) {
          setSetProgress(parsed.progress || {});
          setSubstituteExercises(parsed.substitutes || {});
        }
      } catch (error) {
        console.error('Erro ao carregar progresso de séries do localStorage:', error);
      }
    }

    setIsInitialized(true);
  }, [isInitialized]);

  // Salvar dados automaticamente no localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('workoutPlans', JSON.stringify(workoutPlans));
    lastLocalUpdateRef.current = new Date().toISOString();
  }, [workoutPlans, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('workoutHistory', JSON.stringify(history));
    lastLocalUpdateRef.current = new Date().toISOString();
  }, [history, isInitialized]);

  // Persistir progresso de séries e substitutos no localStorage (com data para invalidar no dia seguinte)
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('workoutSetProgress', JSON.stringify({
      date: new Date().toLocaleDateString('pt-BR'),
      progress: setProgress,
      substitutes: substituteExercises
    }));
  }, [setProgress, substituteExercises, isInitialized]);

  // Configurar listeners em tempo real quando usuário estiver logado
  useEffect(() => {
    if (!userId || !isInitialized) return;

    const handlePlansUpdate = (plans) => {
      if (plans && Array.isArray(plans)) {
        if (ignoreNextUpdateRef.current.plans) {
          ignoreNextUpdateRef.current.plans = false;
          return;
        }

        const normalizedPlans = plans.map(plan => ({
          ...plan,
          createdAt: plan.createdAt?.toDate?.()?.toISOString() || plan.createdAt,
          updatedAt: plan.updatedAt?.toDate?.()?.toISOString() || plan.updatedAt
        }));

        setWorkoutPlans(normalizedPlans);
      }
    };

    const handleHistoryUpdate = (historyData) => {
      if (historyData && Array.isArray(historyData)) {
        if (ignoreNextUpdateRef.current.history) {
          ignoreNextUpdateRef.current.history = false;
          return;
        }

        const normalizedHistory = historyData.map(record => ({
          ...record,
          date: record.date?.toDate?.()?.toISOString() || record.date,
          createdAt: record.createdAt?.toDate?.()?.toISOString() || record.createdAt,
          updatedAt: record.updatedAt?.toDate?.()?.toISOString() || record.updatedAt
        }));

        setHistory(normalizedHistory);
      }
    };

    setupRealtimeListeners(handlePlansUpdate, handleHistoryUpdate);

    return () => {
      cleanupListeners();
    };
  }, [userId, isInitialized, setupRealtimeListeners, cleanupListeners]);

  // Migração inicial: upload de dados locais para Firestore se for primeira vez
  useEffect(() => {
    if (!userId || !isInitialized || isSyncingRef.current) return;

    const migrateData = async () => {
      const isFirstSync = await checkIfFirstSync();

      if (isFirstSync && workoutPlans.length > 0 || history.length > 0) {
        isSyncingRef.current = true;
        await syncLocalToFirestore(workoutPlans, history);
        isSyncingRef.current = false;
      }
    };

    migrateData();
  }, [userId, isInitialized, checkIfFirstSync, syncLocalToFirestore]);

  // Processar fila quando voltar online
  useEffect(() => {
    if (isOnline && userId && hasPendingOperations()) {
      processSyncQueue();
    }
  }, [isOnline, userId, processSyncQueue]);

  // Criar ficha de treino
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
  }, [userId, syncPlan]);

  // Duplicar ficha
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
  }, [userId, syncPlan]);

  // Editar nome da ficha
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
  }, [workoutPlans, userId, syncPlan]);

  // Deletar ficha
  const deletePlan = useCallback((planId) => {
    if (confirm('Deletar esta ficha de treino?')) {
      setWorkoutPlans(prev => prev.filter(plan => plan.id !== planId));

      if (userId) {
        syncDeletePlan(planId);
      }

      return true;
    }
    return false;
  }, [userId, syncDeletePlan]);

  // Adicionar exercício à ficha
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
  }, [workoutPlans, userId, syncPlan]);

  // Editar exercício
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
  }, [workoutPlans, userId, syncPlan]);

  // Deletar exercício
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
  }, [workoutPlans, userId, syncPlan]);

  // Duplicar exercício
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
  }, [workoutPlans, userId, syncPlan]);

  // Mover exercício
  const moveExercise = useCallback((planId, exerciseId, direction) => {
    const updatedPlan = workoutPlans.find(p => p.id === planId);
    if (!updatedPlan) return;

    const index = updatedPlan.exercises.findIndex(ex => ex.id === exerciseId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= updatedPlan.exercises.length) {
      return;
    }

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
  }, [workoutPlans, userId, syncPlan]);

  /**
   * Persiste a carga usada de volta no exercício do plano (atualiza o plano).
   */
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
  }, [workoutPlans, userId, syncPlan]);

  /**
   * Adiciona um exercício substituto à sessão de treino de um plano.
   */
  const addSubstituteExercise = useCallback((planId, exercise) => {
    setSubstituteExercises(prev => ({
      ...prev,
      [planId]: [...(prev[planId] || []), exercise]
    }));
  }, []);

  /**
   * Remove um exercício substituto da sessão de treino de um plano.
   */
  const removeSubstituteExercise = useCallback((planId, exerciseId) => {
    setSubstituteExercises(prev => ({
      ...prev,
      [planId]: (prev[planId] || []).filter(e => e.id !== exerciseId)
    }));
  }, []);

  /**
   * Atualiza a carga utilizada num exercício durante o treino (antes de confirmar séries).
   * Não salva no histórico ainda — só atualiza o setProgress.
   */
  const updateExerciseWeight = useCallback((exerciseId, weight) => {
    setSetProgress(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight: weight === '' ? '' : parseFloat(weight) || 0,
        sets: prev[exerciseId]?.sets || []
      }
    }));
  }, []);

  /**
   * Confirma uma série de um exercício.
   * - Salva as reps no setProgress
   * - NÃO conclui automaticamente — a conclusão é feita pelo botão "concluir exercício"
   * @returns {boolean} sempre false (exercício não concluído por esta ação)
   */
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
  }, [setProgress]);

  /**
   * Conclui um exercício de uma vez, sem exigir confirmação série a série.
   * setsData é um array opcional com as reps digitadas pelo usuário (pode conter nulls).
   */
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

    // Upsert: atualiza se já existe registro hoje para este exercício neste plano
    const today = new Date().toLocaleDateString('pt-BR');
    const existingIdx = history.findIndex(r => {
      const d = new Date(r.date).toLocaleDateString('pt-BR');
      return d === today && r.planId === plan.id && r.exerciseName === exercise.name;
    });

    if (existingIdx >= 0) {
      record.id = history[existingIdx].id;
      record.createdAt = history[existingIdx].createdAt;
      setHistory(prev => prev.map((r, i) => i === existingIdx ? record : r));
    } else {
      setHistory(prev => [record, ...prev]);
    }

    setSetProgress(prev => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });

    // Persiste a carga no plano se foi alterada (apenas exercícios da ficha)
    if (!exercise._substitute) {
      persistWeightToPlan(plan.id, exercise.id, current.weight);
    }

    if (userId) {
      ignoreNextUpdateRef.current.history = true;
      syncHistory(record);
    }

    return true;
  }, [setProgress, history, userId, syncHistory, persistWeightToPlan]);

  /**
   * Desfaz o registro completo de um exercício e restaura o progresso parcial
   * para que o usuário possa reeditar as séries.
   */
  const undoExercise = useCallback((plan, exercise) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const existingRecord = history.find(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      if (recordDate !== today || record.planId !== plan.id) return false;
      // Para substitutos, o exerciseId no record pode não bater com o id efêmero atual
      return record.exerciseId === exercise.id || record.exerciseName === exercise.name;
    });

    if (!existingRecord) return;

    // Remove do histórico
    setHistory(prev => prev.filter(r => r.id !== existingRecord.id));

    // Restaura apenas a carga — séries ficam vazias para reedição
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
  }, [history, userId, syncDeleteHistory]);

  /**
   * Desfaz a confirmação de uma série específica (e todas após ela).
   * Retorna as reps que estavam registradas para pré-preencher o input.
   */
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
  }, [setProgress]);

  // Verificar exercícios concluídos hoje (retorna Set de exerciseId)
  const getTodayRecords = useCallback((planId) => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === planId;
    });
  }, [history]);

  // Remover registro de treino manualmente
  const removeRecord = useCallback((recordId) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));

    if (userId) {
      syncDeleteHistory(recordId);
    }

    return true;
  }, [userId, syncDeleteHistory]);

  // Agrupar histórico por data
  const groupHistoryByDate = useCallback(() => {
    return history.reduce((groups, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});
  }, [history]);

  return {
    workoutPlans,
    history,
    isSyncing,
    syncError,
    isOnline,
    lastSyncedAt,
    setProgress,
    createPlan,
    editPlanName,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    updateExerciseWeight,
    confirmSet,
    unconfirmSet,
    completeExercise,
    undoExercise,
    substituteExercises,
    addSubstituteExercise,
    removeSubstituteExercise,
    getTodayRecords,
    removeRecord,
    groupHistoryByDate
  };
}