import { useState, useEffect } from 'react';

export default function useRestTimer(defaultRestTime = 90) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(defaultRestTime);
  const [timerRunning, setTimerRunning] = useState(false);

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      if (timerActive) {
        alert('Descanso terminado! 💪');
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerActive]);

  // Iniciar timer de descanso
  const startRestTimer = () => {
    setTimerSeconds(defaultRestTime);
    setTimerActive(true);
    setTimerRunning(true);
  };

  // Toggle play/pause
  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  // Resetar timer
  const resetTimer = () => {
    setTimerSeconds(defaultRestTime);
    setTimerRunning(false);
  };

  // Fechar timer
  const closeTimer = () => {
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(defaultRestTime);
  };

  // Setar tempo customizado
  const setCustomTime = (seconds) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
  };

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
    startRestTimer,
    toggleTimer,
    resetTimer,
    closeTimer,
    setCustomTime,
    formatTime
  };
}

