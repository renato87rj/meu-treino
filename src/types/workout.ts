export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  _substitute?: boolean;
  _sourcePlanName?: string;
  _originalName?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  plans: WorkoutPlan[];
  active: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlan {
  id: string;
  programId: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface CompletedSet {
  reps: number | null;
  weight: number | null;
  completed: boolean;
  timestamp: string;
}

export interface WorkoutRecord {
  id: string;
  programId?: string;
  programName?: string;
  planId: string;
  planName: string;
  exerciseId: string;
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

export type SetProgressMap = Record<string, SetProgressEntry>;
export type SubstituteExercisesMap = Record<string, Exercise[]>;

export interface WorkoutSession {
  id: string;
  programId: string;
  programName: string;
  planId: string;
  planName: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
}

export interface WorkoutDraft {
  programId: string;
  programName: string;
  planId: string;
  planName: string;
  startedAt: string;
  records: WorkoutRecord[];
}
