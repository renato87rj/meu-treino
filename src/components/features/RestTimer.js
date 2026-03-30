import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw, Zap } from 'lucide-react';

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
  const [expanded, setExpanded] = useState(false);

  if (!timerActive) return null;

  const finished = timerFinished || timerSeconds === 0;
  const isPaused = !timerRunning;
  const timeLeft = timerSeconds;

  // Timer finalizado — bubble verde pulsante
  if (finished) {
    return (
      <div
        onClick={() => { if (dismissFinished) dismissFinished(); closeTimer(); }}
        className="fixed bottom-[80px] right-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5
                   rounded-[20px] cursor-pointer active:scale-95 transition-transform animate-pulse"
        style={{
          background: 'rgba(34, 197, 94, 0.9)',
          border: '0.5px solid rgba(74, 222, 128, 0.4)',
          backdropFilter: 'blur(12px)',
        }}>
        <Zap size={18} className="text-white" />
        <p className="text-[16px] font-bold text-white">GO!</p>
      </div>
    );
  }

  // Timer expandido (card overlay)
  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
           style={{ background: 'rgba(8, 6, 15, 0.7)', backdropFilter: 'blur(4px)' }}
           onClick={() => setExpanded(false)}>
        <div className="w-full max-w-sm rounded-[24px] p-6"
             style={{
               background: 'rgba(18, 12, 40, 0.96)',
               border: '0.5px solid rgba(139, 92, 246, 0.3)',
               backdropFilter: 'blur(20px)',
             }}
             onClick={e => e.stopPropagation()}>
          {/* Tempo grande */}
          <p className={`text-[64px] font-bold tracking-tight text-center leading-none mb-2 tabular-nums ${
            timeLeft <= 10 ? 'text-red-400' : 'text-white'
          }`}>
            {formatTime(timeLeft)}
          </p>
          <p className="text-center text-[12px] text-[#7c6f9e] mb-6">tempo de descanso</p>

          {/* Atalhos rápidos */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[60, 90, 120, 180].map(s => (
              <button key={s}
                onClick={() => setCustomTime(s)}
                className="py-2 rounded-[10px] text-[12px] font-semibold text-purple-300
                           bg-purple-500/15 border border-purple-500/20
                           active:bg-purple-500/25 transition-colors">
                {s < 60 ? `${s}s` : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
              </button>
            ))}
          </div>

          {/* Controles principais */}
          <div className="flex gap-3">
            <button onClick={resetTimer}
              className="flex-1 py-3 rounded-[14px] text-[13px] font-semibold text-[#7c6f9e]
                         bg-white/[0.05] border border-purple-500/15 active:scale-[0.98] transition-transform
                         flex items-center justify-center">
              <RotateCcw size={14} />
            </button>
            <button onClick={toggleTimer}
              className="flex-[3] py-3 rounded-[14px] text-[14px] font-bold text-white
                         bg-purple-600 active:scale-[0.98] transition-transform">
              {isPaused ? 'Retomar' : 'Pausar'}
            </button>
            <button onClick={() => { if (dismissFinished) dismissFinished(); closeTimer(); setExpanded(false); }}
              className="flex-1 py-3 rounded-[14px] text-[13px] font-semibold text-[#7c6f9e]
                         bg-white/[0.05] border border-purple-500/15 active:scale-[0.98] transition-transform
                         flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Timer minimizado (bubble)
  return (
    <div
      onClick={() => setExpanded(true)}
      className="fixed bottom-[80px] right-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5
                 rounded-[20px] cursor-pointer active:scale-95 transition-transform"
      style={{
        background: 'rgba(124, 58, 237, 0.92)',
        border: '0.5px solid rgba(167, 139, 250, 0.35)',
        backdropFilter: 'blur(12px)',
      }}>
      <div>
        <p className="text-[9px] text-purple-200/70 tracking-widest uppercase leading-none mb-0.5">
          descanso
        </p>
        <p className={`text-[20px] font-bold tracking-tight leading-none tabular-nums ${
          timeLeft <= 10 ? 'text-red-400' : 'text-white'
        }`}>
          {formatTime(timeLeft)}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); toggleTimer(); }}
        className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center
                   active:bg-white/25 transition-colors">
        {isPaused
          ? <Play size={12} className="text-white ml-0.5" fill="white" />
          : <Pause size={12} className="text-white" />
        }
      </button>
    </div>
  );
}
