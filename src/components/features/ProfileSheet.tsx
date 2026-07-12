'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Lock, Ruler, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { UserProfile, BodyMeasurement, MeasurementKey } from '../../types/profile';
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from '../../types/profile';

interface Props {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  measurements: BodyMeasurement[];
  onUploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  onSaveMeasurements: (data: Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'measuredAt'>>) => Promise<{ success: boolean; error?: string }>;
  onChangePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  userEmail: string | null;
  userInitial: string;
}

type Tab = 'profile' | 'measures';

const MEASURE_KEYS: MeasurementKey[] = ['weightKg', 'chestCm', 'waistCm', 'hipCm', 'armCm', 'thighCm'];

export default function ProfileSheet({
  open,
  onClose,
  profile,
  measurements,
  onUploadAvatar,
  onSaveMeasurements,
  onChangePassword,
  userEmail,
  userInitial,
}: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Measurement fields — initialise from latest measurement
  const lastMeasurement = measurements[measurements.length - 1] ?? null;
  const [measures, setMeasures] = useState<Record<MeasurementKey, string>>(() =>
    Object.fromEntries(
      MEASURE_KEYS.map(k => [k, lastMeasurement?.[k] != null ? String(lastMeasurement[k]) : ''])
    ) as Record<MeasurementKey, string>
  );
  const [measuresLoading, setMeasuresLoading] = useState(false);
  const [measuresStatus, setMeasuresStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Sync measures when measurements prop changes
  useEffect(() => {
    const last = measurements[measurements.length - 1] ?? null;
    setMeasures(
      Object.fromEntries(
        MEASURE_KEYS.map(k => [k, last?.[k] != null ? String(last[k]) : ''])
      ) as Record<MeasurementKey, string>
    );
  }, [measurements]);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setTab('profile');
      setNewPassword('');
      setConfirmPassword('');
      setPwdStatus(null);
      setMeasuresStatus(null);
      setAvatarError(null);
    }
  }, [open]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarLoading(true);
    const result = await onUploadAvatar(file);
    setAvatarLoading(false);
    if (!result.success) setAvatarError(result.error ?? 'Erro ao enviar foto');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPwdStatus({ ok: false, msg: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdStatus({ ok: false, msg: 'As senhas não coincidem' });
      return;
    }
    setPwdLoading(true);
    setPwdStatus(null);
    const result = await onChangePassword(newPassword);
    setPwdLoading(false);
    if (result.success) {
      setPwdStatus({ ok: true, msg: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdStatus({ ok: false, msg: result.error ?? 'Erro ao alterar senha' });
    }
  };

  const handleSaveMeasures = async () => {
    const payload: Partial<Omit<BodyMeasurement, 'id' | 'userId' | 'measuredAt'>> = {};
    MEASURE_KEYS.forEach(k => {
      const v = parseFloat(measures[k]);
      if (!isNaN(v) && v > 0) (payload as Record<string, number>)[k] = v;
    });
    if (Object.keys(payload).length === 0) {
      setMeasuresStatus({ ok: false, msg: 'Preencha pelo menos um campo' });
      return;
    }
    setMeasuresLoading(true);
    setMeasuresStatus(null);
    const result = await onSaveMeasurements(payload);
    setMeasuresLoading(false);
    if (result.success) {
      setMeasuresStatus({ ok: true, msg: 'Medidas registradas!' });
    } else {
      setMeasuresStatus({ ok: false, msg: result.error ?? 'Erro ao salvar' });
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto rounded-t-[28px] overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(10, 7, 20, 0.98)',
          border: '0.5px solid rgba(124, 58, 237, 0.25)',
          borderBottom: 'none',
          maxHeight: '92dvh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-[17px] font-bold text-white">Meu Perfil</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 active:scale-95 transition-transform"
          >
            <X size={15} className="text-[#7c6f9e]" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 pb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-purple-600/30 border-2 border-purple-500/40">
              {avatarLoading ? (
                <Loader2 size={24} className="text-purple-400 animate-spin" />
              ) : profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[28px] font-bold text-purple-200">{userInitial}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-purple-600 border-2 border-[#0a0714] active:scale-90 transition-transform shadow-lg"
            >
              <Camera size={12} className="text-white" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-[13px] font-semibold text-white">{userEmail ?? '—'}</p>
          {avatarError && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertCircle size={11} />
              {avatarError}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mb-4 p-1 rounded-[14px] bg-white/[0.04] border border-white/[0.06]">
          {([
            { key: 'profile', label: 'Perfil', icon: Lock },
            { key: 'measures', label: 'Medidas', icon: Ruler },
          ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[12px] font-semibold transition-all ${
                tab === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#7c6f9e] hover:text-white'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(92dvh - 280px)' }}>

          {/* ── Tab: Perfil (senha) ── */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-3">
                  Alterar Senha
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full rounded-[12px] px-4 py-3 text-[13px] text-white placeholder-[#4a4568] border border-purple-500/20 bg-white/[0.04] outline-none focus:border-purple-500/50 transition-colors pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4568] hover:text-[#7c6f9e] transition-colors"
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-[12px] px-4 py-3 text-[13px] text-white placeholder-[#4a4568] border border-purple-500/20 bg-white/[0.04] outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>

              {pwdStatus && (
                <div className={`flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12px] ${
                  pwdStatus.ok
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {pwdStatus.ok ? <Check size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                  {pwdStatus.msg}
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={pwdLoading || !newPassword || !confirmPassword}
                className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold text-white bg-purple-600 active:scale-[0.98] transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {pwdLoading ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          )}

          {/* ── Tab: Medidas ── */}
          {tab === 'measures' && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-purple-400 font-semibold tracking-[.8px] uppercase mb-3">
                  Registrar Medidas
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {MEASURE_KEYS.map(k => {
                    const last = lastMeasurement?.[k];
                    return (
                      <div key={k}>
                        <label className="text-[10px] text-[#7c6f9e] font-medium mb-1 block">
                          {MEASUREMENT_LABELS[k]}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder={last != null ? String(last) : '—'}
                            value={measures[k]}
                            onChange={e => setMeasures(prev => ({ ...prev, [k]: e.target.value }))}
                            className="w-full rounded-[12px] px-3 py-2.5 text-[13px] text-white placeholder-[#3a3060] border border-purple-500/20 bg-white/[0.04] outline-none focus:border-purple-500/50 transition-colors pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#4a4568]">
                            {MEASUREMENT_UNITS[k]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Última medição */}
              {lastMeasurement && (
                <div className="rounded-[12px] px-3 py-2.5 border border-purple-500/15 bg-purple-500/[0.04]">
                  <p className="text-[10px] text-purple-400 font-semibold mb-1">Última medição</p>
                  <p className="text-[10px] text-[#4a4568]">
                    {new Date(lastMeasurement.measuredAt).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {measuresStatus && (
                <div className={`flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[12px] ${
                  measuresStatus.ok
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {measuresStatus.ok ? <Check size={13} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />}
                  {measuresStatus.msg}
                </div>
              )}

              <button
                onClick={handleSaveMeasures}
                disabled={measuresLoading}
                className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold text-white bg-purple-600 active:scale-[0.98] transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {measuresLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {measuresLoading ? 'Registrando...' : 'Registrar Medição'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
