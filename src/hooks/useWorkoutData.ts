import { useState, useEffect, useRef } from 'react';
import useFirestoreSync from './useFirestoreSync';
import usePlans from './usePlans';
import useHistory from './useHistory';
import useWorkoutSession from './useWorkoutSession';
import { hasPendingOperations } from '../utils/syncQueue';
import { loadWorkoutPlansAction, loadWorkoutHistoryAction } from '@/app/actions/workout';
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

  useEffect(() => {
    hasMigratedRef.current = false;
  }, [userId]);

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

  // Migração inicial + carga remota (Server Actions) ao logar
  useEffect(() => {
    if (!userId || !isInitialized || isSyncingRef.current || hasMigratedRef.current) return;

    let cancelled = false;

    const run = async () => {
      try {
        const isFirstSync = await checkIfFirstSync();
        if (cancelled) return;

        if (isFirstSync && (workoutPlans.length > 0 || history.length > 0)) {
          isSyncingRef.current = true;
          await syncLocalToFirestore(workoutPlans, history);
          isSyncingRef.current = false;
        }
        hasMigratedRef.current = true;
        if (cancelled) return;

        const [remotePlans, remoteHistory] = await Promise.all([
          loadWorkoutPlansAction(),
          loadWorkoutHistoryAction(),
        ]);
        if (cancelled) return;

        setWorkoutPlans(remotePlans);
        setHistory(remoteHistory);
      } catch (e) {
        console.error('Erro ao sincronizar com Supabase:', e);
        hasMigratedRef.current = true;
      }
    };

    run();
    return () => {
      cancelled = true;
    };
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
