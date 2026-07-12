'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import type { WorkoutPlan } from '../../types/workout';
import type { UserProfile } from '../../types/profile';

interface Props {
  view: string;
  selectedPlan: WorkoutPlan | null;
  completedCount: number;
  totalCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  profile: UserProfile | null;
  onOpenProfile: () => void;
}

export default function Header({
  view,
  selectedPlan,
  completedCount,
  totalCount,
  isSyncing,
  isOnline,
  profile,
  onOpenProfile,
}: Props) {
  const { logout, user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    showToast('Logout realizado', 'info');
    router.push('/login');
  };

  const handleOpenProfile = () => {
    setDropdownOpen(false);
    onOpenProfile();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';

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
          {view === 'evolution' && 'Evolução'}
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

        {/* Botão de perfil com dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 active:scale-95 transition-transform"
            aria-label="Menu do perfil"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-purple-600/40 border border-purple-500/30 flex-shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-purple-200">{initials}</span>
              )}
            </div>
            <ChevronDown
              size={11}
              className={`text-purple-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-[16px] border border-purple-500/20 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(14, 10, 26, 0.97)', backdropFilter: 'blur(16px)' }}
            >
              {/* Cabeçalho do dropdown */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-[12px] font-semibold text-white truncate">
                  {user?.displayName ?? user?.email ?? 'Usuário'}
                </p>
                <p className="text-[10px] text-[#7c6f9e] truncate mt-0.5">{user?.email ?? ''}</p>
              </div>

              {/* Ação: Meu Perfil */}
              <button
                onClick={handleOpenProfile}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/15 border border-purple-500/20">
                  <User size={13} className="text-purple-400" />
                </div>
                <span className="text-[13px] font-medium text-white">Meu Perfil</span>
              </button>

              {/* Separador */}
              <div className="h-px bg-white/[0.06] mx-4" />

              {/* Ação: Sair */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/[0.06] active:bg-red-500/[0.10] transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/20">
                  <LogOut size={13} className="text-red-400" />
                </div>
                <span className="text-[13px] font-medium text-red-400">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
