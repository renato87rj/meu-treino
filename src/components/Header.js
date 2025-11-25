'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, LogOut, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasPendingOperations } from '../utils/syncQueue';

export default function Header({ 
  view, 
  selectedPlan, 
  todayRecordsCount, 
  totalExercises,
  isSyncing,
  isOnline,
  onAddClick,
  onViewChange
}) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  const getTitle = () => {
    if (view === 'plans') return 'Minhas Fichas';
    if (view === 'workout') return selectedPlan?.name || 'Treinar';
    return 'Histórico';
  };

  return (
    <>
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="text-purple-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {getTitle()}
                </h1>
                {view === 'workout' && selectedPlan && (
                  <p className="text-purple-300 text-sm">
                    {todayRecordsCount}/{totalExercises} exercícios concluídos hoje
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Indicador de sincronização */}
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <div className="flex items-center gap-1 text-yellow-400" title="Sincronizando...">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                ) : !isOnline ? (
                  <div className="flex items-center gap-1 text-orange-400" title="Modo offline - alterações serão sincronizadas quando voltar online">
                    <CloudOff size={18} />
                  </div>
                ) : hasPendingOperations() ? (
                  <div className="flex items-center gap-1 text-blue-400" title="Há alterações pendentes para sincronizar">
                    <Cloud size={18} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-400" title="Tudo sincronizado">
                    <Cloud size={18} />
                  </div>
                )}
              </div>
              
              {view === 'plans' && (
                <button
                  onClick={onAddClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
                >
                  <Plus size={24} />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewChange('plans')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              view === 'plans' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            Fichas
          </button>
          <button
            onClick={() => onViewChange('workout')}
            disabled={!selectedPlan}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              view === 'workout' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20 disabled:opacity-50'
            }`}
          >
            Treinar
          </button>
          <button
            onClick={() => onViewChange('history')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              view === 'history' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'
            }`}
          >
            Histórico
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
