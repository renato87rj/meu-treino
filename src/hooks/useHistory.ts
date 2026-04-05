import { useCallback } from 'react';
import type { WorkoutRecord } from '../types/workout';
import type { MutableRefObject } from 'react';

type IgnoreRef = MutableRefObject<{ plans: boolean; history: boolean }>;

export default function useHistory(
  history: WorkoutRecord[],
  setHistory: React.Dispatch<React.SetStateAction<WorkoutRecord[]>>,
  userId: string | null,
  syncHistory: (record: WorkoutRecord) => void,
  syncDeleteHistory: (recordId: number) => void,
  ignoreNextUpdateRef: IgnoreRef
) {

  const getTodayRecords = useCallback((planId: string | number) => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === planId;
    });
  }, [history]);

  const removeRecord = useCallback((recordId: number) => {
    setHistory(prev => prev.filter(r => r.id !== recordId));

    if (userId) {
      syncDeleteHistory(recordId);
    }

    return true;
  }, [userId, syncDeleteHistory, setHistory]);

  const groupHistoryByDate = useCallback(() => {
    return history.reduce((groups, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {} as Record<string, WorkoutRecord[]>);
  }, [history]);

  const saveRecord = useCallback((record: WorkoutRecord) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const existingIdx = history.findIndex(r => {
      const d = new Date(r.date).toLocaleDateString('pt-BR');
      return d === today && r.planId === record.planId && r.exerciseName === record.exerciseName;
    });

    if (existingIdx >= 0) {
      const merged = {
        ...record,
        id: history[existingIdx].id,
        createdAt: history[existingIdx].createdAt,
      };
      setHistory(prev => prev.map((r, i) => i === existingIdx ? merged : r));
      return merged;
    } else {
      setHistory(prev => [record, ...prev]);
      return record;
    }
  }, [history, setHistory]);

  const syncRecord = useCallback((record: WorkoutRecord) => {
    if (userId) {
      ignoreNextUpdateRef.current.history = true;
      syncHistory(record);
    }
  }, [userId, syncHistory, ignoreNextUpdateRef]);

  return {
    getTodayRecords,
    removeRecord,
    groupHistoryByDate,
    saveRecord,
    syncRecord,
  };
}
