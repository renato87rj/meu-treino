export interface Exercise {
  id: number | string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  _substitute?: boolean;
  _sourcePlanName?: string;
  _originalName?: string;
}

export interface WorkoutPlan {
  id: number;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CompletedSet {
  reps: number | null;
}

export interface WorkoutRecord {
  id: number;
  planId: number;
  planName: string;
  exerciseId: number;
  exerciseName: string;
  plannedSets: number;
  plannedReps: string;
  plannedWeight: number | null;
  weight: number | null;
  completedSets: CompletedSet[];
  completed: boolean;
  substitute?: boolean;
  sourcePlanName?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  durationMinutes?: number;
}

export interface SetProgressEntry {
  weight: number | string;
  sets: Array<{ reps: number | null }>;
}

export type SetProgressMap = Record<number | string, SetProgressEntry>;
export type SubstituteExercisesMap = Record<number | string, Exercise[]>;
