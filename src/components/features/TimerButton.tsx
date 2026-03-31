import React, { useState } from 'react';
import { Timer, X, Play, Save, Check } from 'lucide-react';

interface Props {
  onStartTimer: (seconds: number) => void;
  defaultTime: number;
  onSetDefaultTime: (seconds: number) => void;
}

export default function TimerButton({
  onStartTimer,
  defaultTime,
  onSetDefaultTime,
}: Props) {
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number | string>(Math.floor(defaultTime / 60));
  const [customSeconds, setCustomSeconds] = useState<number | string>(defaultTime % 60);
  const [saved, setSaved] = useState(false);

  const handleStartTimer = () => {
    const totalSeconds = (parseInt(String(customMinutes)) * 60) + parseInt(String(customSeconds));
    if (totalSeconds > 0) {
      onStartTimer(totalSeconds);
      setShowTimerConfig(false);
      setCustomMinutes(Math.floor(defaultTime / 60));
      setCustomSeconds(defaultTime % 60);
    }
  };

  const handleQuickTime = (minutes: number, seconds: number) => {
    setCustomMinutes(minutes);
    setCustomSeconds(seconds);
    setSaved(false);
  };

  const handleSaveDefault = () => {
    const totalSeconds = (parseInt(String(customMinutes)) * 60) + parseInt(String(customSeconds));
    if (totalSeconds > 0 && onSetDefaultTime) {
      onSetDefaultTime(totalSeconds);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <>
      {/* Botão flutuante — acima do TabBar */}
      <button
        onClick={() => setShowTimerConfig(true)}
        className="fixed bottom-[80px] right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center
                   active:scale-95 transition-transform"
        style={{
          background: 'rgba(124, 58, 237, 0.92)',
          border: '0.5px solid rgba(167, 139, 250, 0.35)',
          backdropFilter: 'blur(12px)',
        }}
        title="Iniciar timer de descanso"
      >
        <Timer className="text-white" size={20} />
      </button>

      {/* Modal slide-up */}
      {showTimerConfig && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
             style={{ background: 'rgba(8, 6, 15, 0.75)', backdropFilter: 'blur(6px)' }}
             onClick={() => setShowTimerConfig(false)}>
          <div
            className="w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] p-6 animate-slide-up"
            style={{
              background: 'rgba(15, 10, 30, 0.98)',
              border: '0.5px solid rgba(139, 92, 246, 0.25)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-purple-500/30 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold text-white">Timer de Descanso</h2>
              <button
                onClick={() => setShowTimerConfig(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 border border-purple-500/15">
                <X size={13} className="text-[#7c6f9e]" />
              </button>
            </div>
            
            <p className="text-[12px] text-[#7c6f9e] mb-4">
              Escolha o tempo de descanso desejado
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#7c6f9e] mb-1.5">Minutos</label>
                  <input
                    type="number" min="0" max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                               px-4 py-3 text-[22px] text-white text-center
                               focus:outline-none focus:border-purple-400/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7c6f9e] mb-1.5">Segundos</label>
                  <input
                    type="number" min="0" max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(e.target.value)}
                    className="w-full bg-white/[0.05] border border-purple-500/25 rounded-[12px]
                               px-4 py-3 text-[22px] text-white text-center
                               focus:outline-none focus:border-purple-400/50"
                  />
                </div>
              </div>

              {/* Atalhos rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {[[1,0],[1,30],[2,0],[3,0]].map(([m,s]) => (
                  <button key={`${m}:${s}`}
                    onClick={() => handleQuickTime(m, s)}
                    className="py-2 rounded-[10px] text-[12px] font-semibold text-purple-300
                               bg-purple-500/15 border border-purple-500/20
                               active:bg-purple-500/25 transition-colors">
                    {m}:{String(s).padStart(2,'0')}
                  </button>
                ))}
              </div>

              {/* Salvar como padrão */}
              <button
                onClick={handleSaveDefault}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all ${
                  saved
                    ? 'bg-green-500/[0.08] text-green-400 border border-green-500/25'
                    : 'bg-white/[0.05] text-[#7c6f9e] border border-purple-500/15'
                }`}>
                {saved ? <Check size={13} /> : <Save size={13} />}
                {saved ? 'Salvo!' : 'Salvar como padrão'}
              </button>

              <div className="flex gap-3 mt-1">
                <button 
                  onClick={handleStartTimer} 
                  className="flex-1 bg-purple-600 text-white font-semibold text-[14px]
                             py-3.5 rounded-[14px] active:scale-[0.98] transition-transform
                             flex items-center justify-center gap-2">
                  <Play size={15} />
                  Iniciar
                </button>
                <button 
                  onClick={() => setShowTimerConfig(false)} 
                  className="flex-1 bg-white/[0.05] border border-purple-500/15 text-[#7c6f9e] font-semibold text-[14px]
                             py-3.5 rounded-[14px] active:scale-[0.98] transition-transform">
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
