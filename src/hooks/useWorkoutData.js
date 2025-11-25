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

  // Configurar listeners em tempo real quando usuário estiver logado
  useEffect(() => {
    if (!userId || !isInitialized) return;

    const handlePlansUpdate = (plans) => {
      if (plans && Array.isArray(plans)) {
        // Ignorar atualização se foi uma mudança local recente
        if (ignoreNextUpdateRef.current.plans) {
          ignoreNextUpdateRef.current.plans = false;
          return;
        }
        
        // Converter timestamps do Firestore para formato compatível
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
        // Ignorar atualização se foi uma mudança local recente
        if (ignoreNextUpdateRef.current.history) {
          ignoreNextUpdateRef.current.history = false;
          return;
        }
        
        // Converter timestamps do Firestore
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
    
    // Sincronizar com Firebase
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

  // Registrar treino
  const recordWorkout = useCallback((plan, exercise) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const existingRecord = history.find(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && 
             record.planId === plan.id && 
             record.exerciseId === exercise.id;
    });

    if (existingRecord) {
      // Remover (desmarcar)
      setHistory(prev => prev.filter(r => r.id !== existingRecord.id));
      
      if (userId) {
        syncDeleteHistory(existingRecord.id);
      }
      
      return false;
    } else {
      // Criar novo registro
      const record = {
        id: Date.now(),
        planId: plan.id,
        planName: plan.name,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        plannedSets: exercise.sets,
        plannedReps: exercise.reps,
        completed: true,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setHistory(prev => [record, ...prev]);
      
      if (userId) {
        ignoreNextUpdateRef.current.history = true;
        syncHistory(record);
      }
      
      return true;
    }
  }, [history, userId, syncHistory, syncDeleteHistory]);

  // Verificar exercícios concluídos hoje
  const getTodayRecords = useCallback((planId) => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === planId;
    });
  }, [history]);

  // Remover registro de treino
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
    createPlan,
    editPlanName,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    recordWorkout,
    getTodayRecords,
    removeRecord,
    groupHistoryByDate
  };
}
