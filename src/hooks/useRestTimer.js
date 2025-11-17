import { useState, useEffect } from 'react';

export default function useRestTimer(defaultRestTime = 90) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(defaultRestTime);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMinimized, setTimerMinimized] = useState(false);
  const [defaultTime, setDefaultTime] = useState(defaultRestTime);

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
    setTimerSeconds(defaultTime);
    setTimerActive(true);
    setTimerRunning(true);
    setTimerMinimized(false);
  };

  // Toggle play/pause
  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  // Resetar timer
  const resetTimer = () => {
    setTimerSeconds(defaultTime);
    setTimerRunning(false);
  };

  // Fechar timer
  const closeTimer = () => {
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(defaultTime);
    setTimerMinimized(false);
  };

  // Toggle minimizar/expandir
  const toggleMinimize = () => {
    setTimerMinimized(!timerMinimized);
  };

  // Setar tempo customizado
  const setCustomTime = (seconds) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
  };

  // Alterar tempo padrão
  const setDefaultRestTime = (seconds) => {
    setDefaultTime(seconds);
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
    timerMinimized,
    defaultTime,
    startRestTimer,
    toggleTimer,
    resetTimer,
    closeTimer,
    toggleMinimize,
    setCustomTime,
    setDefaultRestTime,
    formatTime
  };
}

