import { useState, useEffect, useRef, useCallback } from 'react';
import useFirestoreSync from './useFirestoreSync';
import usePlans from './usePlans';
import useHistory from './useHistory';
import useWorkoutSession from './useWorkoutSession';
import { hasPendingOperations } from '../utils/syncQueue';
import { loadWorkoutPlansAction, loadWorkoutProgramsAction, loadWorkoutHistoryAction, upsertWorkoutSessionAction, batchUpsertWorkoutHistoryAction, upsertWorkoutProgramAction, deleteWorkoutProgramAction } from '@/app/actions/workout';
import type { WorkoutPlan, WorkoutProgram, WorkoutRecord, WorkoutDraft, SetProgressMap, SubstituteExercisesMap } from '../types/workout';

export default function useWorkoutData(userId: string | null = null) {
  const [workoutPrograms, setWorkoutPrograms] = useState<WorkoutProgram[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('workoutPrograms');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });

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

  const [draft, setDraft] = useState<WorkoutDraft | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('workoutDraft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showDraftModal, setShowDraftModal] = useState(false);
  
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
    permanentFailures,
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
  } = useWorkoutSession(setProgress, setSetProgress, substituteExercises, setSubstituteExercises, persistWeightToPlan, draft, setDraft);

  const createProgram = useCallback((name: string) => {
    if (!name.trim()) return false;
    const program: WorkoutProgram = {
      id: crypto.randomUUID(),
      name: name.trim(),
      plans: [],
      active: workoutPrograms.length === 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkoutPrograms(prev => [...prev, program]);
    if (userId) upsertWorkoutProgramAction(program).catch(console.error);
    return true;
  }, [workoutPrograms, userId]);

  const editProgramName = useCallback((programId: string, newName: string) => {
    if (!newName.trim()) return false;
    let updated: WorkoutProgram | null = null;
    setWorkoutPrograms(prev => prev.map(p => {
      if (p.id !== programId) return p;
      updated = { ...p, name: newName.trim(), updatedAt: new Date().toISOString() };
      return updated;
    }));
    if (userId && updated) upsertWorkoutProgramAction(updated).catch(console.error);
    return true;
  }, [userId]);

  const archiveProgram = useCallback((programId: string) => {
    let updated: WorkoutProgram | null = null;
    setWorkoutPrograms(prev => prev.map(p => {
      if (p.id !== programId) return p;
      updated = { ...p, archived: true, active: false, updatedAt: new Date().toISOString() };
      return updated;
    }));
    if (userId && updated) upsertWorkoutProgramAction(updated).catch(console.error);
  }, [userId]);

  const unarchiveProgram = useCallback((programId: string) => {
    let updated: WorkoutProgram | null = null;
    setWorkoutPrograms(prev => prev.map(p => {
      if (p.id !== programId) return p;
      updated = { ...p, archived: false, updatedAt: new Date().toISOString() };
      return updated;
    }));
    if (userId && updated) upsertWorkoutProgramAction(updated).catch(console.error);
  }, [userId]);

  const deleteProgram = useCallback((programId: string) => {
    setWorkoutPrograms(prev => prev.filter(p => p.id !== programId));
    setWorkoutPlans(prev => prev.filter(p => p.programId !== programId));
    if (userId) deleteWorkoutProgramAction(programId).catch(console.error);
  }, [userId]);

  const setActiveProgram = useCallback((programId: string) => {
    const toSync: WorkoutProgram[] = [];
    setWorkoutPrograms(prev => prev.map(p => {
      const updated = { ...p, active: p.id === programId, updatedAt: new Date().toISOString() };
      toSync.push(updated);
      return updated;
    }));
    if (userId) toSync.forEach(p => upsertWorkoutProgramAction(p).catch(console.error));
  }, [userId]);

  const startWorkout = useCallback((plan: WorkoutPlan) => {
    const program = workoutPrograms.find(p => p.id === plan.programId);
    setDraft(prev => {
      if (prev) return prev;
      const newDraft: WorkoutDraft = {
        programId: plan.programId,
        programName: program?.name ?? '',
        planId: plan.id,
        planName: plan.name,
        startedAt: new Date().toISOString(),
        records: [],
      };
      localStorage.setItem('workoutDraft', JSON.stringify(newDraft));
      return newDraft;
    });
  }, [workoutPrograms]);

  const commitSession = useCallback(async () => {
    if (!draft) return;
    const finishedAt = new Date().toISOString();
    const durationMinutes = Math.max(1, Math.round(
      (new Date(finishedAt).getTime() - new Date(draft.startedAt).getTime()) / 60000
    ));

    const recordsWithDuration = draft.records.map(r => ({
      ...r,
      programId: draft.programId,
      programName: draft.programName,
      durationMinutes,
      updatedAt: finishedAt,
    }));

    recordsWithDuration.forEach(r => saveRecord(r));

    if (userId) {
      try {
        const session = {
          id: crypto.randomUUID(),
          programId: draft.programId,
          programName: draft.programName,
          planId: draft.planId,
          planName: draft.planName,
          startedAt: draft.startedAt,
          finishedAt,
          durationMinutes,
        };
        await Promise.all([
          upsertWorkoutSessionAction(session),
          batchUpsertWorkoutHistoryAction(recordsWithDuration),
        ]);
      } catch (e) {
        console.error('Erro ao salvar sessão:', e);
      }
    }

    setDraft(null);
    localStorage.removeItem('workoutDraft');
  }, [draft, userId, saveRecord]);

  const discardDraft = useCallback(() => {
    setDraft(null);
    setShowDraftModal(false);
    localStorage.removeItem('workoutDraft');
    setSetProgress({});
    setSubstituteExercises({});
  }, [setSetProgress, setSubstituteExercises]);

  const resumeDraft = useCallback(() => {
    setShowDraftModal(false);
  }, []);

  useEffect(() => {
    if (isInitialized && draft) {
      setShowDraftModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (draft) {
      localStorage.setItem('workoutDraft', JSON.stringify(draft));
    } else {
      localStorage.removeItem('workoutDraft');
    }
  }, [draft, isInitialized]);

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

  // Persistir programas no localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('workoutPrograms', JSON.stringify(workoutPrograms));
  }, [workoutPrograms, isInitialized]);

  // Migração inicial + carga remota (Server Actions) ao logar
  useEffect(() => {
    if (!userId || !isInitialized || isSyncingRef.current || hasMigratedRef.current) return;

    let cancelled = false;

    const run = async () => {
      try {
        const isFirstSync = await checkIfFirstSync();
        if (cancelled) return;

        if (isFirstSync && (workoutPrograms.length > 0 || workoutPlans.length > 0 || history.length > 0)) {
          isSyncingRef.current = true;
          // Programas devem ser salvos antes dos planos (FK constraint)
          for (const program of workoutPrograms) {
            await upsertWorkoutProgramAction(program).catch(console.error);
          }
          await syncLocalToFirestore(workoutPlans, history);
          isSyncingRef.current = false;
        }
        hasMigratedRef.current = true;
        if (cancelled) return;

        const [remotePrograms, remotePlans, remoteHistory] = await Promise.all([
          loadWorkoutProgramsAction(),
          loadWorkoutPlansAction(),
          loadWorkoutHistoryAction(),
        ]);
        if (cancelled) return;

        setWorkoutPrograms(remotePrograms);
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

  const getDraftRecords = useCallback((planId: string) => {
    if (!draft || draft.planId !== planId) return [];
    return draft.records;
  }, [draft]);

  return {
    workoutPrograms,
    workoutPlans,
    history,
    draft,
    showDraftModal,
    isSyncing,
    syncError,
    isOnline,
    lastSyncedAt,
    permanentFailures,
    setProgress,
    createProgram,
    editProgramName,
    archiveProgram,
    unarchiveProgram,
    deleteProgram,
    setActiveProgram,
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
    getDraftRecords,
    removeRecord,
    groupHistoryByDate,
    startWorkout,
    commitSession,
    discardDraft,
    resumeDraft,
  };
}
