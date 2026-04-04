import { useState } from 'react';

export default function useFinishedPlans() {
  const [finishedPlanIds, setFinishedPlanIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const stored = JSON.parse(localStorage.getItem('workoutFinished') || '{}');
      const ids = new Set<string>();
      Object.entries(stored).forEach(([planId, date]) => {
        if (date === today) ids.add(planId);
      });
      return ids;
    } catch { return new Set<string>(); }
  });

  const isFinished = (planId: string) => finishedPlanIds.has(planId);

  const setWorkoutFinished = (planId: string, finished: boolean) => {
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
