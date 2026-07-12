export interface UserProfile {
  userId: string;
  avatarUrl: string | null;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  updatedAt: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  weightKg: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  measuredAt: string;
}

export type MeasurementKey = 'weightKg' | 'chestCm' | 'waistCm' | 'hipCm' | 'armCm' | 'thighCm';

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  weightKg: 'Peso (kg)',
  chestCm: 'Peito (cm)',
  waistCm: 'Cintura (cm)',
  hipCm: 'Quadril (cm)',
  armCm: 'Braço (cm)',
  thighCm: 'Coxa (cm)',
};

export const MEASUREMENT_UNITS: Record<MeasurementKey, string> = {
  weightKg: 'kg',
  chestCm: 'cm',
  waistCm: 'cm',
  hipCm: 'cm',
  armCm: 'cm',
  thighCm: 'cm',
};
