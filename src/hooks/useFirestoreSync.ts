import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToWorkoutPlans,
  subscribeToWorkoutHistory,
  saveWorkoutPlan,
  saveWorkoutHistory,
  deleteWorkoutPlan,
  deleteWorkoutHistory,
  syncAllData,
  loadWorkoutPlans,
  loadWorkoutHistory
} from '../lib/firestore';
import {
  getSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  incrementRetry,
  removeFailedOperations,
  clearSyncQueue,
  SYNC_OPERATIONS
} from '../utils/syncQueue';
import type { WorkoutPlan, WorkoutRecord } from '../types/workout';

/**
 * Hook para gerenciar sincronização entre localStorage e Firestore
 */
export default function useFirestoreSync(userId: string | null, isOnline: boolean = true) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isInitialSync, setIsInitialSync] = useState(false);
  
  const plansUnsubscribeRef = useRef<(() => void) | null>(null);
  const historyUnsubscribeRef = useRef<(() => void) | null>(null);
  const isProcessingQueueRef = useRef(false);

  /**
   * Verificar se é a primeira sincronização do usuário
   */
  const checkIfFirstSync = useCallback(async () => {
    if (!userId) return false;
    try {
      const plans = await loadWorkoutPlans(userId);
      return plans.length === 0;
    } catch (error: unknown) {
      console.error('Erro ao verificar primeira sincronização:', error);
      return false;
    }
  }, [userId]);

  /**
   * Processar fila de sincronização pendente
   */
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
              await saveWorkoutPlan(userId, item.data as WorkoutPlan);
              removeFromSyncQueue(item.id);
              break;
            
            case SYNC_OPERATIONS.DELETE_PLAN:
              await deleteWorkoutPlan(userId, String((item.data as { id: string | number }).id));
              removeFromSyncQueue(item.id);
              break;
            
            case SYNC_OPERATIONS.CREATE_HISTORY:
              await saveWorkoutHistory(userId, item.data as WorkoutRecord);
              removeFromSyncQueue(item.id);
              break;
            
            case SYNC_OPERATIONS.DELETE_HISTORY:
              await deleteWorkoutHistory(userId, (item.data as { id: string }).id);
              removeFromSyncQueue(item.id);
              break;
            
            default:
              console.warn('Operação desconhecida na fila:', item.operation);
              removeFromSyncQueue(item.id);
          }
        } catch (error: unknown) {
          console.error(`Erro ao processar item da fila ${item.id}:`, error);
          incrementRetry(item.id);
          
          // Se excedeu tentativas, remover da fila
          const updatedItem = getSyncQueue().find(q => q.id === item.id);
          if (updatedItem && updatedItem.retries >= 3) {
            removeFromSyncQueue(item.id);
          }
        }
      }

      // Remover operações que falharam muitas vezes
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

  /**
   * Sincronizar dados do localStorage para Firestore (upload inicial)
   */
  const syncLocalToFirestore = useCallback(async (workoutPlans: WorkoutPlan[], history: WorkoutRecord[]) => {
    if (!userId || !isOnline) {
      // Se offline, adicionar à fila
      workoutPlans.forEach(plan => {
        addToSyncQueue(SYNC_OPERATIONS.CREATE_PLAN, plan);
      });
      history.forEach(record => {
        addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
      });
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      await syncAllData(userId, workoutPlans, history);
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
  }, [userId, isOnline]);

  /**
   * Sincronizar um plano (criar ou atualizar)
   */
  const syncPlan = useCallback(async (plan: WorkoutPlan) => {
    if (!userId) return false;

    if (!isOnline) {
      addToSyncQueue(SYNC_OPERATIONS.UPDATE_PLAN, plan);
      return false;
    }

    try {
      await saveWorkoutPlan(userId, plan);
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (error: unknown) {
      console.error('Erro ao sincronizar plano:', error);
      addToSyncQueue(SYNC_OPERATIONS.UPDATE_PLAN, plan);
      setSyncError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [userId, isOnline]);

  /**
   * Sincronizar deletar plano
   */
  const syncDeletePlan = useCallback(async (planId: string | number) => {
    if (!userId) return false;

    if (!isOnline) {
      addToSyncQueue(SYNC_OPERATIONS.DELETE_PLAN, { id: planId });
      return false;
    }

    try {
      await deleteWorkoutPlan(userId, String(planId));
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (error: unknown) {
      console.error('Erro ao deletar plano:', error);
      addToSyncQueue(SYNC_OPERATIONS.DELETE_PLAN, { id: planId });
      setSyncError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [userId, isOnline]);

  /**
   * Sincronizar registro de histórico
   */
  const syncHistory = useCallback(async (record: WorkoutRecord) => {
    if (!userId) return false;

    if (!isOnline) {
      addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
      return false;
    }

    try {
      await saveWorkoutHistory(userId, record);
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (error: unknown) {
      console.error('Erro ao sincronizar histórico:', error);
      addToSyncQueue(SYNC_OPERATIONS.CREATE_HISTORY, record);
      setSyncError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [userId, isOnline]);

  /**
   * Sincronizar deletar histórico
   */
  const syncDeleteHistory = useCallback(async (recordId: number) => {
    if (!userId) return false;

    if (!isOnline) {
      addToSyncQueue(SYNC_OPERATIONS.DELETE_HISTORY, { id: recordId });
      return false;
    }

    try {
      await deleteWorkoutHistory(userId, String(recordId));
      setLastSyncedAt(new Date().toISOString());
      return true;
    } catch (error: unknown) {
      console.error('Erro ao deletar histórico:', error);
      addToSyncQueue(SYNC_OPERATIONS.DELETE_HISTORY, { id: recordId });
      setSyncError(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, [userId, isOnline]);

  /**
   * Configurar listeners em tempo real
   */
  const setupRealtimeListeners = useCallback((onPlansUpdate: (plans: WorkoutPlan[]) => void, onHistoryUpdate: (history: WorkoutRecord[]) => void) => {
    if (!userId) return;

    // Limpar listeners anteriores
    if (plansUnsubscribeRef.current) {
      plansUnsubscribeRef.current();
    }
    if (historyUnsubscribeRef.current) {
      historyUnsubscribeRef.current();
    }

    // Configurar novos listeners
    plansUnsubscribeRef.current = subscribeToWorkoutPlans(userId, (plans, error) => {
      if (error) {
        console.error('Erro no listener de planos:', error);
        setSyncError(error instanceof Error ? error.message : String(error));
        return;
      }
      if (onPlansUpdate && plans) {
        onPlansUpdate(plans);
      }
    });

    historyUnsubscribeRef.current = subscribeToWorkoutHistory(userId, (history, error) => {
      if (error) {
        console.error('Erro no listener de histórico:', error);
        setSyncError(error instanceof Error ? error.message : String(error));
        return;
      }
      if (onHistoryUpdate && history) {
        onHistoryUpdate(history);
      }
    });
  }, [userId]);

  /**
   * Limpar listeners
   */
  const cleanupListeners = useCallback(() => {
    if (plansUnsubscribeRef.current) {
      plansUnsubscribeRef.current();
      plansUnsubscribeRef.current = null;
    }
    if (historyUnsubscribeRef.current) {
      historyUnsubscribeRef.current();
      historyUnsubscribeRef.current = null;
    }
  }, []);

  /**
   * Processar fila quando voltar online
   */
  useEffect(() => {
    if (isOnline && userId) {
      processSyncQueue();
    }
  }, [isOnline, userId, processSyncQueue]);

  /**
   * Limpar listeners ao desmontar
   */
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

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
    processSyncQueue
  };
}

