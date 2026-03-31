'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import type { WorkoutPlan } from '../../types/workout';

interface Props {
  view: string;
  selectedPlan: WorkoutPlan | null;
  completedCount: number;
  totalCount: number;
  isSyncing: boolean;
  isOnline: boolean;
}

export default function Header({
  view,
  selectedPlan,
  completedCount,
  totalCount,
  isSyncing,
  isOnline,
}: Props) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-purple-500/10"
      style={{ background: 'rgba(8, 6, 15, 0.85)', backdropFilter: 'blur(12px)' }}>

      {/* Título dinâmico da aba ativa */}
      <div>
        {view === 'workout' && selectedPlan && (
          <p className="text-[10px] text-purple-400/60 tracking-widest uppercase font-medium mb-0.5">
            treinando
          </p>
        )}
        <h1 className="text-[19px] font-bold text-white tracking-tight leading-none">
          {view === 'plans' && 'Fichas'}
          {view === 'workout' && (selectedPlan?.name ?? 'Treinar')}
          {view === 'history' && 'Histórico'}
        </h1>
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-2">
        {/* Indicador de sync */}
        <div className={`w-2 h-2 rounded-full ${
          !isOnline ? 'bg-orange-400' :
          isSyncing ? 'bg-yellow-400 animate-pulse' :
          'bg-green-400'
        }`} />

        {/* Botão de logout */}
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/25 bg-purple-500/15 active:scale-95 transition-transform"
          title="Sair"
        >
          <LogOut size={13} className="text-purple-300" />
        </button>
      </div>
    </header>
  );
}
