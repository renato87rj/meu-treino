import React, { useState } from 'react';
import { Dumbbell, Plus, Settings, X } from 'lucide-react';

export default function Header({ 
  view, 
  selectedPlan, 
  todayRecordsCount, 
  totalExercises,
  onAddClick,
  onViewChange,
  timerActive,
  defaultTime,
  onSetDefaultTime
}) {
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(defaultTime / 60));
  const [customSeconds, setCustomSeconds] = useState(defaultTime % 60);

  const handleSaveTimerConfig = () => {
    const totalSeconds = (parseInt(customMinutes) * 60) + parseInt(customSeconds);
    if (totalSeconds > 0) {
      onSetDefaultTime(totalSeconds);
      setShowTimerConfig(false);
    }
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
            <div className="flex gap-2">
              {view === 'workout' && (
                <button
                  onClick={() => setShowTimerConfig(true)}
                  className="bg-purple-600/50 hover:bg-purple-600 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
                  title="Configurar timer"
                >
                  <Settings size={24} />
                </button>
              )}
              {view === 'plans' && (
                <button
                  onClick={onAddClick}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
                >
                  <Plus size={24} />
                </button>
              )}
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

      {/* Modal de Configuração do Timer */}
      {showTimerConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Configurar Timer Padrão</h2>
              <button
                onClick={() => setShowTimerConfig(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-purple-300 text-sm mb-4">
              Defina o tempo padrão de descanso entre séries
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Minutos</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-center text-2xl focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Segundos</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white text-center text-2xl focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Atalhos rápidos */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                <button
                  onClick={() => { setCustomMinutes(1); setCustomSeconds(0); }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  1:00
                </button>
                <button
                  onClick={() => { setCustomMinutes(1); setCustomSeconds(30); }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  1:30
                </button>
                <button
                  onClick={() => { setCustomMinutes(2); setCustomSeconds(0); }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  2:00
                </button>
                <button
                  onClick={() => { setCustomMinutes(3); setCustomSeconds(0); }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  3:00
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-6">
                <button 
                  onClick={handleSaveTimerConfig} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                >
                  Salvar
                </button>
                <button 
                  onClick={() => setShowTimerConfig(false)} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

