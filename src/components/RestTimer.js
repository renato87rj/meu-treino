import React from 'react';
import { Timer, X, Play, Pause, RotateCcw } from 'lucide-react';

export default function RestTimer({ 
  timerActive,
  timerSeconds,
  timerRunning,
  formatTime,
  toggleTimer,
  resetTimer,
  closeTimer,
  setCustomTime
}) {
  if (!timerActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-2xl border-2 border-purple-400/50 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="text-white" size={20} />
            <span className="text-white font-semibold">Descanso</span>
          </div>
          <button
            onClick={closeTimer}
            className="text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="text-center mb-4">
          <div className={`text-5xl font-bold ${timerSeconds <= 10 ? 'text-red-300' : 'text-white'}`}>
            {formatTime(timerSeconds)}
          </div>
          {timerSeconds === 0 && (
            <div className="text-green-300 font-semibold mt-2 animate-pulse">
              Pronto! 💪
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTimer}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {timerRunning ? <Pause size={16} /> : <Play size={16} />}
            {timerRunning ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={resetTimer}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg"
            title="Reiniciar"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Atalhos de tempo */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            onClick={() => setCustomTime(60)}
            className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
          >
            1min
          </button>
          <button
            onClick={() => setCustomTime(90)}
            className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
          >
            1:30
          </button>
          <button
            onClick={() => setCustomTime(120)}
            className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
          >
            2min
          </button>
        </div>
      </div>
    </div>
  );
}

