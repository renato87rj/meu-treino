import React, { useState } from 'react';
import { Timer, X, Play } from 'lucide-react';

export default function TimerButton({ 
  onStartTimer,
  defaultTime
}) {
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(Math.floor(defaultTime / 60));
  const [customSeconds, setCustomSeconds] = useState(defaultTime % 60);

  const handleStartTimer = () => {
    const totalSeconds = (parseInt(customMinutes) * 60) + parseInt(customSeconds);
    if (totalSeconds > 0) {
      onStartTimer(totalSeconds);
      setShowTimerConfig(false);
      // Resetar para o padrão após iniciar
      setCustomMinutes(Math.floor(defaultTime / 60));
      setCustomSeconds(defaultTime % 60);
    }
  };

  const handleQuickTime = (minutes, seconds) => {
    setCustomMinutes(minutes);
    setCustomSeconds(seconds);
  };

  return (
    <>
      {/* Botão Flutuante - posicionado no canto inferior direito */}
      <button
        onClick={() => setShowTimerConfig(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full p-4 shadow-2xl border-2 border-purple-400/50 backdrop-blur-md hover:scale-105 transition-transform"
        title="Iniciar timer de descanso"
      >
        <Timer className="text-white" size={24} />
      </button>

      {/* Modal de Configuração e Início do Timer */}
      {showTimerConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Timer de Descanso</h2>
              <button
                onClick={() => setShowTimerConfig(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-purple-300 text-sm mb-4">
              Escolha o tempo de descanso desejado
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
                  onClick={() => handleQuickTime(1, 0)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  1:00
                </button>
                <button
                  onClick={() => handleQuickTime(1, 30)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  1:30
                </button>
                <button
                  onClick={() => handleQuickTime(2, 0)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  2:00
                </button>
                <button
                  onClick={() => handleQuickTime(3, 0)}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 text-sm py-2 rounded-lg"
                >
                  3:00
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-6">
                <button 
                  onClick={handleStartTimer} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Iniciar
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

