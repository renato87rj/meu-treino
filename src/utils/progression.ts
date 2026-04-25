import type { WorkoutRecord } from '../types/workout';

export type ProgressionResult =
  | { kind: 'up';   label: '↑ PROGRESSO' }
  | { kind: 'down'; label: '↓ REGRESSÃO' }
  | null;

function avgReps(record: WorkoutRecord): number {
  const sets = record.completedSets ?? [];
  if (sets.length === 0) return 0;
  const total = sets.reduce((acc, s) => acc + (s?.reps != null ? Number(s.reps) : 0), 0);
  return total / sets.length;
}

export function calcProgression(
  current: WorkoutRecord,
  last: WorkoutRecord
): ProgressionResult {
  const cWeight = current.weight != null ? Number(current.weight) : null;
  const lWeight = last.weight != null ? Number(last.weight) : null;

  if (cWeight !== null && lWeight !== null) {
    if (cWeight > lWeight) return { kind: 'up', label: '↑ PROGRESSO' };
    if (cWeight < lWeight) return { kind: 'down', label: '↓ REGRESSÃO' };
  }

  // Carga igual (ou sem carga): comparar reps
  const cReps = avgReps(current);
  const lReps = avgReps(last);
  const diff = cReps - lReps;

  if (diff > 0) return { kind: 'up', label: '↑ PROGRESSO' };
  if (diff < -1) return { kind: 'down', label: '↓ REGRESSÃO' };

  return null;
}
