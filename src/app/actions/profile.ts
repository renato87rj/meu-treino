'use server';

import { createClient } from '@/lib/supabase/server';
import type { UserProfile, BodyMeasurement } from '@/types/profile';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return { supabase, user };
}

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    userId: String(row.user_id),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    chestCm: row.chest_cm != null ? Number(row.chest_cm) : null,
    waistCm: row.waist_cm != null ? Number(row.waist_cm) : null,
    hipCm: row.hip_cm != null ? Number(row.hip_cm) : null,
    armCm: row.arm_cm != null ? Number(row.arm_cm) : null,
    thighCm: row.thigh_cm != null ? Number(row.thigh_cm) : null,
    updatedAt: String(row.updated_at),
  };
}

function rowToMeasurement(row: Record<string, unknown>): BodyMeasurement {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    chestCm: row.chest_cm != null ? Number(row.chest_cm) : null,
    waistCm: row.waist_cm != null ? Number(row.waist_cm) : null,
    hipCm: row.hip_cm != null ? Number(row.hip_cm) : null,
    armCm: row.arm_cm != null ? Number(row.arm_cm) : null,
    thighCm: row.thigh_cm != null ? Number(row.thigh_cm) : null,
    measuredAt: String(row.measured_at),
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return rowToProfile(data as Record<string, unknown>);
}

export async function upsertProfile(
  updates: Partial<Omit<UserProfile, 'userId' | 'avatarUrl' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const payload: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };
  if (updates.weightKg !== undefined) payload.weight_kg = updates.weightKg;
  if (updates.chestCm !== undefined) payload.chest_cm = updates.chestCm;
  if (updates.waistCm !== undefined) payload.waist_cm = updates.waistCm;
  if (updates.hipCm !== undefined) payload.hip_cm = updates.hipCm;
  if (updates.armCm !== undefined) payload.arm_cm = updates.armCm;
  if (updates.thighCm !== undefined) payload.thigh_cm = updates.thighCm;

  const { error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAvatarUrl(
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addBodyMeasurement(
  data: Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'measuredAt'>>
): Promise<{ success: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  const payload: Record<string, unknown> = {
    user_id: user.id,
    measured_at: new Date().toISOString(),
  };
  if (data.weightKg !== undefined) payload.weight_kg = data.weightKg;
  if (data.chestCm !== undefined) payload.chest_cm = data.chestCm;
  if (data.waistCm !== undefined) payload.waist_cm = data.waistCm;
  if (data.hipCm !== undefined) payload.hip_cm = data.hipCm;
  if (data.armCm !== undefined) payload.arm_cm = data.armCm;
  if (data.thighCm !== undefined) payload.thigh_cm = data.thighCm;

  const { error } = await supabase.from('body_measurements').insert(payload);

  if (error) return { success: false, error: error.message };

  // Also update the current profile snapshot
  await upsertProfile(data);

  return { success: true };
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToMeasurement);
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase } = await requireUser();

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getAvatarUploadUrl(
  fileName: string
): Promise<{ path: string; uploadUrl: string } | { error: string }> {
  const { supabase, user } = await requireUser();

  const ext = fileName.split('.').pop() ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUploadUrl(path);

  if (error || !data) return { error: error?.message ?? 'Erro ao gerar URL de upload' };
  return { path, uploadUrl: data.signedUrl };
}

export async function getPublicAvatarUrl(path: string): Promise<string> {
  const { supabase } = await requireUser();
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
