import { useState, useEffect, useRef } from 'react';
import useFirestoreSync from './useFirestoreSync';
import usePlans from './usePlans';
import useHistory from './useHistory';
import useWorkoutSession from './useWorkoutSession';
import { hasPendingOperations } from '../utils/syncQueue';
import type { WorkoutPlan, WorkoutRecord, SetProgressMap, SubstituteExercisesMap } from '../types/workout';

export default function useWorkoutData(userId: string | null = null) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('workoutPlans');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar planos do localStorage:', error);
      }
    }
    return [];
  });
  
  const [history, setHistory] = useState<WorkoutRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('workoutHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar histórico do localStorage:', error);
      }
    }
    return [];
  });
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [setProgress, setSetProgress] = useState<SetProgressMap>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('workoutSetProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toLocaleDateString('pt-BR')) {
          return parsed.progress || {};
        }
      } catch (error) {
        console.error('Erro ao carregar progresso de séries do localStorage:', error);
      }
    }
    return {};
  });
  
  const [substituteExercises, setSubstituteExercises] = useState<SubstituteExercisesMap>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('workoutSetProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toLocaleDateString('pt-BR')) {
          return parsed.substitutes || {};
        }
      } catch (error) {
        console.error('Erro ao carregar substitutos do localStorage:', error);
      }
    }
    return {};
  });

  const isSyncingRef = useRef(false);
  const hasMigratedRef = useRef(false);
  const lastLocalUpdateRef = useRef<string | null>(null);
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
  } = useWorkoutSession(setProgress, setSetProgress, substituteExercises, setSubstituteExercises, saveRecord, syncRecord, persistWeightToPlan, history, setHistory, userId, syncDeleteHistory);

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

  // Marcar como inicializado após o primeiro render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

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

    const handlePlansUpdate = (plans: WorkoutPlan[]) => {
      if (plans && Array.isArray(plans)) {
        if (ignoreNextUpdateRef.current.plans) {
          ignoreNextUpdateRef.current.plans = false;
          return;
        }

        const normalizedPlans = plans.map((plan: any) => ({
          ...plan,
          createdAt: plan.createdAt?.toDate?.()?.toISOString() || plan.createdAt,
          updatedAt: plan.updatedAt?.toDate?.()?.toISOString() || plan.updatedAt
        }));

        setWorkoutPlans(normalizedPlans);
      }
    };

    const handleHistoryUpdate = (historyData: WorkoutRecord[]) => {
      if (historyData && Array.isArray(historyData)) {
        if (ignoreNextUpdateRef.current.history) {
          ignoreNextUpdateRef.current.history = false;
          return;
        }

        const normalizedHistory = historyData.map((record: any) => ({
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
    if (!userId || !isInitialized || isSyncingRef.current || hasMigratedRef.current) return;

    const migrateData = async () => {
      const isFirstSync = await checkIfFirstSync();

      if (isFirstSync && (workoutPlans.length > 0 || history.length > 0)) {
        isSyncingRef.current = true;
        hasMigratedRef.current = true;
        await syncLocalToFirestore(workoutPlans, history);
        isSyncingRef.current = false;
      } else {
        hasMigratedRef.current = true;
      }
    };

    migrateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isInitialized]);

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
