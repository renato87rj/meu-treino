'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, BodyMeasurement } from '../types/profile';
import {
  getProfile,
  upsertProfile,
  addBodyMeasurement,
  getBodyMeasurements,
  updatePassword,
  getAvatarUploadUrl,
  getPublicAvatarUrl,
  updateAvatarUrl,
} from '../app/actions/profile';
import { createClient } from '../lib/supabase/client';

export default function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [p, m] = await Promise.all([getProfile(), getBodyMeasurements()]);
    setProfile(p);
    setMeasurements(m);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const saveProfile = useCallback(
    async (data: Partial<Omit<UserProfile, 'userId' | 'avatarUrl' | 'updatedAt'>>) => {
      const result = await upsertProfile(data);
      if (result.success) {
        await fetchAll();
      }
      return result;
    },
    [fetchAll]
  );

  const addMeasurement = useCallback(
    async (data: Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'measuredAt'>>) => {
      const result = await addBodyMeasurement(data);
      if (result.success) {
        await fetchAll();
      }
      return result;
    },
    [fetchAll]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'Usuário não autenticado' };

      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) return { success: false, error: uploadError.message };

      const publicUrl = await getPublicAvatarUrl(path);
      const result = await updateAvatarUrl(publicUrl);
      if (result.success) {
        await fetchAll();
      }
      return result;
    },
    [userId, fetchAll]
  );

  const changePassword = useCallback(async (newPassword: string) => {
    return await updatePassword(newPassword);
  }, []);

  return {
    profile,
    measurements,
    loading,
    saveProfile,
    addMeasurement,
    uploadAvatar,
    changePassword,
    refetch: fetchAll,
  };
}
