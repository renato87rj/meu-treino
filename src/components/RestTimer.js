import React from 'react';
import { Timer, X, Play, Pause, RotateCcw, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function RestTimer({ 
  timerActive,
  timerSeconds,
  timerRunning,
  timerMinimized,
  timerFinished,
  formatTime,
  toggleTimer,
  resetTimer,
  closeTimer,
  toggleMinimize,
  dismissFinished,
  setCustomTime
}) {
  if (!timerActive) return null;

  const finished = timerFinished || timerSeconds === 0;

  // Versão minimizada
  if (timerMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => { if (finished && dismissFinished) dismissFinished(); toggleMinimize(); }}
          className={`rounded-full p-3 shadow-2xl border-2 backdrop-blur-md hover:scale-105 transition-transform ${
            finished
              ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-400/50 animate-pulse'
              : 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {finished ? <Zap className="text-white" size={20} /> : <Timer className="text-white" size={20} />}
            <div className={`text-lg font-bold ${
              finished ? 'text-white' : timerSeconds <= 10 ? 'text-red-300' : 'text-white'
            }`}>
              {finished ? 'GO!' : formatTime(timerSeconds)}
            </div>
            <ChevronUp className="text-white/70" size={16} />
          </div>
        </button>
      </div>
    );
  }

  // Versão expandida
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`rounded-2xl p-5 shadow-2xl border-2 backdrop-blur-md min-w-[220px] ${
        finished
          ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400/50'
          : 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400/50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {finished ? <Zap className="text-white" size={18} /> : <Timer className="text-white" size={18} />}
            <span className="text-white font-semibold text-sm">
              {finished ? 'Pronto!' : 'Descanso'}
            </span>
          </div>
          <div className="flex gap-0.5">
            <button
              onClick={toggleMinimize}
              className="text-white/70 hover:text-white p-1"
              title="Minimizar"
            >
              <ChevronDown size={18} />
            </button>
            <button
              onClick={() => { if (dismissFinished) dismissFinished(); closeTimer(); }}
              className="text-white/70 hover:text-white p-1"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="text-center mb-3">
          {finished ? (
            <div className="py-2">
              <div className="text-3xl font-bold text-white animate-pulse">Hora de treinar! 💪</div>
              <p className="text-green-200/80 text-xs mt-1">Descanso concluído</p>
            </div>
          ) : (
            <div className={`text-4xl font-bold ${timerSeconds <= 10 ? 'text-red-300' : 'text-white'}`}>
              {formatTime(timerSeconds)}
            </div>
          )}
        </div>

        {finished ? (
          <button
            onClick={() => { if (dismissFinished) dismissFinished(); closeTimer(); }}
            className="w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-medium text-sm"
          >
            Fechar
          </button>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={toggleTimer}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
              >
                {timerRunning ? <Pause size={14} /> : <Play size={14} />}
                {timerRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={resetTimer}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg"
                title="Reiniciar"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Atalhos de tempo */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                onClick={() => setCustomTime(60)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded"
              >
                1min
              </button>
              <button
                onClick={() => setCustomTime(90)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded"
              >
                1:30
              </button>
              <button
                onClick={() => setCustomTime(120)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs py-1 rounded"
              >
                2min
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
