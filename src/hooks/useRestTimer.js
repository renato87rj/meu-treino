import { useState, useEffect, useRef, useCallback } from 'react';

export default function useRestTimer(defaultRestTime = 90) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(defaultRestTime);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [defaultTime, setDefaultTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('restTimerDefault');
      if (saved) return parseInt(saved, 10);
    }
    return defaultRestTime;
  });
  const [timerFinished, setTimerFinished] = useState(false);

  const audioRef = useRef(null);

  // Pedir permissão de notificação ao montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Notificar quando o timer terminar
  const notifyTimerEnd = useCallback(() => {
    // Vibrar (móvel)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Tocar som de alarme (Web Audio API — 3 beeps)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time, freq = 880, duration = 0.15) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      const now = ctx.currentTime;
      playBeep(now, 880, 0.15);
      playBeep(now + 0.25, 880, 0.15);
      playBeep(now + 0.5, 1100, 0.3);
    } catch {}

    // Notificação nativa (funciona em background no mobile)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('Descanso terminado! 💪', {
              body: 'Hora de voltar ao treino!',
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'rest-timer',
              renotify: true,
              vibrate: [200, 100, 200, 100, 200]
            });
          });
        } else {
          new Notification('Descanso terminado! 💪', {
            body: 'Hora de voltar ao treino!',
            icon: '/icon-192.png',
            tag: 'rest-timer'
          });
        }
      } catch {}
    }

    setTimerFinished(true);
  }, []);

  // Limpar flag de finished
  const dismissFinished = useCallback(() => {
    setTimerFinished(false);
  }, []);

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      if (timerActive) {
        notifyTimerEnd();
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerActive, notifyTimerEnd]);

  // Iniciar timer de descanso
  const startRestTimer = useCallback((customSeconds = null) => {
    const timeToUse = customSeconds !== null ? customSeconds : defaultTime;
    setTimerSeconds(timeToUse);
    setTimerActive(true);
    setTimerRunning(true);
    setTimerMinimized(true);
    setTimerFinished(false);
  }, [defaultTime]);

  // Toggle play/pause
  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  // Resetar timer
  const resetTimer = () => {
    setTimerSeconds(defaultTime);
    setTimerRunning(false);
    setTimerFinished(false);
  };

  // Fechar timer
  const closeTimer = () => {
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(defaultTime);
    setTimerMinimized(false);
    setTimerFinished(false);
  };

  // Toggle minimizar/expandir
  const toggleMinimize = () => {
    setTimerMinimized(!timerMinimized);
  };

  // Setar tempo customizado
  const setCustomTime = (seconds) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
    setTimerFinished(false);
  };

  // Alterar tempo padrão e persistir
  const setDefaultRestTime = useCallback((seconds) => {
    setDefaultTime(seconds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('restTimerDefault', String(seconds));
    }
  }, []);

  // Formatar tempo para exibição
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timerActive,
    timerSeconds,
    timerRunning,
    timerMinimized,
    timerFinished,
    defaultTime,
    startRestTimer,
    toggleTimer,
    resetTimer,
    closeTimer,
    toggleMinimize,
    setCustomTime,
    setDefaultRestTime,
    dismissFinished,
    formatTime
  };
}

