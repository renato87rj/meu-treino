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

  const endTimeRef = useRef(null);   // timestamp absoluto de quando o timer termina
  const pausedLeftRef = useRef(null); // segundos restantes ao pausar

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

  // Recalcular segundos restantes a partir do timestamp absoluto
  const syncFromEndTime = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setTimerSeconds(0);
      setTimerRunning(false);
      endTimeRef.current = null;
      notifyTimerEnd();
    } else {
      setTimerSeconds(remaining);
    }
  }, [notifyTimerEnd]);

  // Timer de descanso — baseado em timestamp absoluto
  useEffect(() => {
    if (!timerRunning || !endTimeRef.current) return;
    const interval = setInterval(syncFromEndTime, 250);
    return () => clearInterval(interval);
  }, [timerRunning, syncFromEndTime]);

  // Recalcular ao voltar do background (visibilitychange)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && timerRunning && endTimeRef.current) {
        syncFromEndTime();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [timerRunning, syncFromEndTime]);

  // Iniciar timer de descanso
  const startRestTimer = useCallback((customSeconds = null) => {
    const timeToUse = customSeconds !== null ? customSeconds : defaultTime;
    endTimeRef.current = Date.now() + timeToUse * 1000;
    pausedLeftRef.current = null;
    setTimerSeconds(timeToUse);
    setTimerActive(true);
    setTimerRunning(true);
    setTimerMinimized(true);
    setTimerFinished(false);
  }, [defaultTime]);

  // Toggle play/pause
  const toggleTimer = useCallback(() => {
    setTimerRunning(prev => {
      if (prev) {
        // Pausar — guardar segundos restantes
        const remaining = endTimeRef.current ? Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000)) : timerSeconds;
        pausedLeftRef.current = remaining;
        endTimeRef.current = null;
        return false;
      } else {
        // Retomar — recalcular endTime
        const left = pausedLeftRef.current ?? timerSeconds;
        endTimeRef.current = Date.now() + left * 1000;
        pausedLeftRef.current = null;
        return true;
      }
    });
  }, [timerSeconds]);

  // Resetar timer
  const resetTimer = useCallback(() => {
    endTimeRef.current = null;
    pausedLeftRef.current = null;
    setTimerSeconds(defaultTime);
    setTimerRunning(false);
    setTimerFinished(false);
  }, [defaultTime]);

  // Fechar timer
  const closeTimer = useCallback(() => {
    endTimeRef.current = null;
    pausedLeftRef.current = null;
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(defaultTime);
    setTimerMinimized(false);
    setTimerFinished(false);
  }, [defaultTime]);

  // Toggle minimizar/expandir
  const toggleMinimize = () => {
    setTimerMinimized(!timerMinimized);
  };

  // Setar tempo customizado
  const setCustomTime = useCallback((seconds) => {
    endTimeRef.current = Date.now() + seconds * 1000;
    pausedLeftRef.current = null;
    setTimerSeconds(seconds);
    setTimerRunning(true);
    setTimerFinished(false);
  }, []);

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

