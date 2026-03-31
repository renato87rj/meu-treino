import { useState } from 'react';

export default function useFinishedPlans() {
  const [finishedPlanIds, setFinishedPlanIds] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const stored = JSON.parse(localStorage.getItem('workoutFinished') || '{}');
      const ids = new Set();
      Object.entries(stored).forEach(([planId, date]) => {
        if (date === today) ids.add(planId);
      });
      return ids;
    } catch { return new Set(); }
  });

  const isFinished = (planId) => finishedPlanIds.has(planId);

  const setWorkoutFinished = (planId, finished) => {
    const today = new Date().toLocaleDateString('pt-BR');
    setFinishedPlanIds(prev => {
      const next = new Set(prev);
      if (finished) next.add(planId); else next.delete(planId);
      return next;
    });
    try {
      const stored = JSON.parse(localStorage.getItem('workoutFinished') || '{}');
      if (finished) stored[planId] = today; else delete stored[planId];
      localStorage.setItem('workoutFinished', JSON.stringify(stored));
    } catch {}
  };

  return { isFinished, setWorkoutFinished };
}
