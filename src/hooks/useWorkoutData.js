import { useState, useEffect, useRef } from 'react';
import useFirestoreSync from './useFirestoreSync';
import usePlans from './usePlans';
import useHistory from './useHistory';
import useWorkoutSession from './useWorkoutSession';
import { hasPendingOperations } from '../utils/syncQueue';

export default function useWorkoutData(userId = null) {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [setProgress, setSetProgress] = useState({});
  const [substituteExercises, setSubstituteExercises] = useState({});

  const isSyncingRef = useRef(false);
  const lastLocalUpdateRef = useRef(null);
  const ignoreNextUpdateRef = useRef({ plans: false, history: false });

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

  const {
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
  } = usePlans(workoutPlans, setWorkoutPlans, userId, syncPlan, syncDeletePlan, ignoreNextUpdateRef);

  const {
    getTodayRecords,
    removeRecord,
    groupHistoryByDate,
    saveRecord,
    syncRecord,
  } = useHistory(history, setHistory, userId, syncHistory, syncDeleteHistory, ignoreNextUpdateRef);

  const {
    updateExerciseWeight,
    confirmSet,
    unconfirmSet,
    completeExercise,
    undoExercise,
    addSubstituteExercise,
    removeSubstituteExercise,
  } = useWorkoutSession(setProgress, setSetProgress, substituteExercises, setSubstituteExercises, saveRecord, syncRecord, persistWeightToPlan);

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
