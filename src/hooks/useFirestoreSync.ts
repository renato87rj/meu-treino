import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadWorkoutPlansAction,
  loadWorkoutHistoryAction,
  upsertWorkoutPlanAction,
  upsertWorkoutHistoryAction,
  deleteWorkoutPlanAction,
  deleteWorkoutHistoryAction,
  syncAllDataAction,
} from '@/app/actions/workout';
import {
  getSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  incrementRetry,
  removeFailedOperations,
  clearSyncQueue,
  SYNC_OPERATIONS,
} from '../utils/syncQueue';
import type { WorkoutPlan, WorkoutRecord } from '../types/workout';

/**
 * Sincronização local ↔ Supabase via Server Actions (sem listeners em tempo real).
 */
export default function useFirestoreSync(userId: string | null, isOnline: boolean = true) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isInitialSync, setIsInitialSync] = useState(false);

  const isProcessingQueueRef = useRef(false);

  const checkIfFirstSync = useCallback(async () => {
    if (!userId) return false;
    try {
      const plans = await loadWorkoutPlansAction();
      return plans.length === 0;
    } catch (error: unknown) {
      console.error('Erro ao verificar primeira sincronização:', error);
      return false;
    }
  }, [userId]);

  const processSyncQueue = useCallback(async () => {
    if (!userId || !isOnline || isProcessingQueueRef.current) return;

    const queue = getSyncQueue();
    if (queue.length === 0) return;

    isProcessingQueueRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      for (const item of queue) {
        try {
          switch (item.operation) {
            case SYNC_OPERATIONS.CREATE_PLAN:
            case SYNC_OPERATIONS.UPDATE_PLAN:
              await upsertWorkoutPlanAction(item.data as WorkoutPlan);
              removeFromSyncQueue(item.id);
              break;

            case SYNC_OPERATIONS.DELETE_PLAN:
              await deleteWorkoutPlanAction(String((item.data as { id: string }).id));
              removeFromSyncQueue(item.id);
              break;

            case SYNC_OPERATIONS.CREATE_HISTORY:
              await upsertWorkoutHistoryAction(item.data as WorkoutRecord);
              removeFromSyncQueue(item.id);
              break;

            case SYNC_OPERATIONS.DELETE_HISTORY:
              await deleteWorkoutHistoryAction((item.data as { id: string }).id);
              removeFromSyncQueue(item.id);
              break;

            default:
              console.warn('Operação desconhecida na fila:', item.operation);
              removeFromSyncQueue(item.id);
          }
        } catch (error: unknown) {
          console.error(`Erro ao processar item da fila ${item.id}:`, error);
          incrementRetry(item.id);

          const updatedItem = getSyncQueue().find((q) => q.id === item.id);
          if (updatedItem && updatedItem.retries >= 3) {
            removeFromSyncQueue(item.id);
          }
        }
      }

      removeFailedOperations();

      setLastSyncedAt(new Date().toISOString());
    } catch (error: unknown) {
      console.error('Erro ao processar fila de sincronização:', error);
      setSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSyncing(false);
      isProcessingQueueRef.current = false;
    }
  }, [userId, isOnline]);

  const syncLocalToFirestore = useCallback(
    async (workoutPlans: WorkoutPlan[], history: WorkoutRecord[]) => {
      if (!userId || !isOnline) {
        workoutPlans.forEach((plan) => {
          addToSyncQueue(SYNC_OPERATIONS.CREATE_PLAN, plan);
        });
        history.forEach((record) => {
          addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
        });
        return false;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        await syncAllDataAction(workoutPlans, history);
        setLastSyncedAt(new Date().toISOString());
        setIsInitialSync(true);
        return true;
      } catch (error: unknown) {
        console.error('Erro ao sincronizar dados locais:', error);
        setSyncError(error instanceof Error ? error.message : String(error));
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [userId, isOnline]
  );

  const syncPlan = useCallback(
    async (plan: WorkoutPlan) => {
      if (!userId) return false;

      if (!isOnline) {
        addToSyncQueue(SYNC_OPERATIONS.UPDATE_PLAN, plan);
        return false;
      }

      try {
        await upsertWorkoutPlanAction(plan);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (error: unknown) {
        console.error('Erro ao sincronizar plano:', error);
        addToSyncQueue(SYNC_OPERATIONS.UPDATE_PLAN, plan);
        setSyncError(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [userId, isOnline]
  );

  const syncDeletePlan = useCallback(
    async (planId: string) => {
      if (!userId) return false;

      if (!isOnline) {
        addToSyncQueue(SYNC_OPERATIONS.DELETE_PLAN, { id: planId });
        return false;
      }

      try {
        await deleteWorkoutPlanAction(planId);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (error: unknown) {
        console.error('Erro ao deletar plano:', error);
        addToSyncQueue(SYNC_OPERATIONS.DELETE_PLAN, { id: planId });
        setSyncError(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [userId, isOnline]
  );

  const syncHistory = useCallback(
    async (record: WorkoutRecord) => {
      if (!userId) return false;

      if (!isOnline) {
        addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
        return false;
      }

      try {
        await upsertWorkoutHistoryAction(record);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (error: unknown) {
        console.error('Erro ao sincronizar histórico:', error);
        addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
        setSyncError(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [userId, isOnline]
  );

  const syncDeleteHistory = useCallback(
    async (recordId: string) => {
      if (!userId) return false;

      if (!isOnline) {
        addToSyncQueue(SYNC_OPERATIONS.DELETE_HISTORY, { id: recordId });
        return false;
      }

      try {
        await deleteWorkoutHistoryAction(recordId);
        setLastSyncedAt(new Date().toISOString());
        return true;
      } catch (error: unknown) {
        console.error('Erro ao deletar histórico:', error);
        addToSyncQueue(SYNC_OPERATIONS.DELETE_HISTORY, { id: recordId });
        setSyncError(error instanceof Error ? error.message : String(error));
        return false;
      }
    },
    [userId, isOnline]
  );

  /** Mantido por compatibilidade; não há mais listeners — use fetch remoto em useWorkoutData. */
  const setupRealtimeListeners = useCallback(
    (_onPlansUpdate: (plans: WorkoutPlan[]) => void, _onHistoryUpdate: (history: WorkoutRecord[]) => void) => {
      // no-op
    },
    []
  );

  const cleanupListeners = useCallback(() => {
    // no-op
  }, []);

  useEffect(() => {
    if (isOnline && userId) {
      processSyncQueue();
    }
  }, [isOnline, userId, processSyncQueue]);

  return {
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
    processSyncQueue,
  };
}
