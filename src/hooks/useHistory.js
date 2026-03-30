import { useCallback } from 'react';

export default function useHistory(history, setHistory, userId, syncHistory, syncDeleteHistory, ignoreNextUpdateRef) {

  const getTodayRecords = useCallback((planId) => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === planId;
    });
  }, [history]);

  const removeRecord = useCallback((recordId) => {
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
    }, {});
  }, [history]);

  const saveRecord = useCallback((record) => {
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

  const syncRecord = useCallback((record) => {
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
