'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Calendar, CheckCircle, Edit2, Save, X, ClipboardList, ChevronRight, Copy, ChevronUp, ChevronDown, Timer, Play, Pause, RotateCcw, Settings } from 'lucide-react';

export default function WorkoutTracker() {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('plans'); // 'plans', 'workout', 'history'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [recordingExercise, setRecordingExercise] = useState(null);
  
  // Timer de descanso
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [defaultRestTime, setDefaultRestTime] = useState(90);
  
  const [newPlanName, setNewPlanName] = useState('');
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: ''
  });
  const [recordData, setRecordData] = useState({
    sets: '',
    reps: '',
    weight: ''
  });

  // Carregar dados
  useEffect(() => {
    const savedPlans = localStorage.getItem('workoutPlans');
    const savedHistory = localStorage.getItem('workoutHistory');
    
    if (savedPlans) {
      setWorkoutPlans(JSON.parse(savedPlans));
    }
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar dados
  useEffect(() => {
    localStorage.setItem('workoutPlans', JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(history));
  }, [history]);

  // Timer de descanso
  useEffect(() => {
    let interval;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      // Toca alarme quando termina
      setTimerRunning(false);
      // Você pode adicionar um som aqui se quiser
      if (timerActive) {
        alert('Descanso terminado! 💪');
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerActive]);

  // Criar ficha de treino
  const createPlan = () => {
    if (!newPlanName.trim()) {
      alert('Digite um nome para a ficha');
      return;
    }

    const plan = {
      id: Date.now(),
      name: newPlanName,
      exercises: []
    };

    setWorkoutPlans([...workoutPlans, plan]);
    setNewPlanName('');
    setShowAddPlan(false);
  };

  // Adicionar exercício à ficha
  const addExerciseToPlan = () => {
    if (!newExercise.name || !newExercise.sets || !newExercise.reps || !newExercise.weight) {
      alert('Preencha todos os campos');
      return;
    }

    const exercise = {
      id: Date.now(),
      name: newExercise.name,
      sets: parseInt(newExercise.sets),
      reps: parseInt(newExercise.reps),
      weight: parseFloat(newExercise.weight)
    };

    setWorkoutPlans(workoutPlans.map(plan => 
      plan.id === selectedPlan.id
        ? { ...plan, exercises: [...plan.exercises, exercise] }
        : plan
    ));

    setNewExercise({ name: '', sets: '', reps: '', weight: '' });
    setShowAddExercise(false);
  };

  // Salvar edição de exercício
  const saveEditExercise = () => {
    if (!editingExercise.name || !editingExercise.sets || !editingExercise.reps || !editingExercise.weight) {
      alert('Preencha todos os campos');
      return;
    }

    setWorkoutPlans(workoutPlans.map(plan =>
      plan.id === selectedPlan.id
        ? {
            ...plan,
            exercises: plan.exercises.map(ex =>
              ex.id === editingExercise.id ? editingExercise : ex
            )
          }
        : plan
    ));
    setEditingExercise(null);
  };

  // Deletar exercício
  const deleteExercise = (exerciseId) => {
    if (confirm('Remover este exercício da ficha?')) {
      setWorkoutPlans(workoutPlans.map(plan =>
        plan.id === selectedPlan.id
          ? { ...plan, exercises: plan.exercises.filter(ex => ex.id !== exerciseId) }
          : plan
      ));
    }
  };

  // Duplicar ficha
  const duplicatePlan = (plan) => {
    const newPlan = {
      id: Date.now(),
      name: `${plan.name} (cópia)`,
      exercises: plan.exercises.map(ex => ({...ex, id: Date.now() + Math.random()}))
    };
    setWorkoutPlans([...workoutPlans, newPlan]);
  };

  // Mover exercício para cima
  const moveExerciseUp = (exerciseId) => {
    setWorkoutPlans(workoutPlans.map(plan => {
      if (plan.id === selectedPlan.id) {
        const index = plan.exercises.findIndex(ex => ex.id === exerciseId);
        if (index > 0) {
          const newExercises = [...plan.exercises];
          [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
          return { ...plan, exercises: newExercises };
        }
      }
      return plan;
    }));
  };

  // Mover exercício para baixo
  const moveExerciseDown = (exerciseId) => {
    setWorkoutPlans(workoutPlans.map(plan => {
      if (plan.id === selectedPlan.id) {
        const index = plan.exercises.findIndex(ex => ex.id === exerciseId);
        if (index < plan.exercises.length - 1) {
          const newExercises = [...plan.exercises];
          [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
          return { ...plan, exercises: newExercises };
        }
      }
      return plan;
    }));
  };

  // Duplicar exercício
  const duplicateExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      id: Date.now(),
      name: `${exercise.name} (cópia)`
    };

    setWorkoutPlans(workoutPlans.map(plan =>
      plan.id === selectedPlan.id
        ? { ...plan, exercises: [...plan.exercises, newExercise] }
        : plan
    ));
  };

  // Registrar treino
  const recordWorkout = () => {
    if (!recordData.sets || !recordData.reps || !recordData.weight) {
      alert('Preencha todos os campos');
      return;
    }

    const record = {
      id: Date.now(),
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      exerciseId: recordingExercise.id,
      exerciseName: recordingExercise.name,
      plannedSets: recordingExercise.sets,
      plannedReps: recordingExercise.reps,
      plannedWeight: recordingExercise.weight,
      actualSets: parseInt(recordData.sets),
      actualReps: parseInt(recordData.reps),
      actualWeight: parseFloat(recordData.weight),
      date: new Date().toISOString()
    };

    setHistory([record, ...history]);
    setRecordData({ sets: '', reps: '', weight: '' });
    setRecordingExercise(null);
    
    // Iniciar timer de descanso
    startRestTimer();
  };

  // Funções do timer
  const startRestTimer = () => {
    setTimerSeconds(defaultRestTime);
    setTimerActive(true);
    setTimerRunning(true);
  };

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerSeconds(defaultRestTime);
    setTimerRunning(false);
  };

  const closeTimer = () => {
    setTimerActive(false);
    setTimerRunning(false);
    setTimerSeconds(defaultRestTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar registro
  const startRecording = (exercise) => {
    setRecordingExercise(exercise);
    setRecordData({
      sets: exercise.sets.toString(),
      reps: exercise.reps.toString(),
      weight: exercise.weight.toString()
    });
  };

  // Selecionar ficha para treinar
  const selectPlanForWorkout = (plan) => {
    setSelectedPlan(plan);
    setView('workout');
  };

  // Verificar exercícios concluídos hoje
  const getTodayRecords = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    return history.filter(record => {
      const recordDate = new Date(record.date).toLocaleDateString('pt-BR');
      return recordDate === today && record.planId === selectedPlan?.id;
    });
  };

  // Agrupar histórico por data
  const groupHistoryByDate = () => {
    return history.reduce((groups, record) => {
      const date = new Date(record.date).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});
  };

  const todayRecords = view === 'workout' ? getTodayRecords() : [];
  const completedToday = new Set(todayRecords.map(r => r.exerciseId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="text-purple-400" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {view === 'plans' ? 'Minhas Fichas' : view === 'workout' ? selectedPlan?.name : 'Histórico'}
                </h1>
                {view === 'workout' && (
                  <p className="text-purple-300 text-sm">
                    {todayRecords.length}/{selectedPlan?.exercises.length || 0} exercícios concluídos hoje
                  </p>
                )}
              </div>
            </div>
            {view === 'plans' && (
              <button
                onClick={() => setShowAddPlan(!showAddPlan)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
              >
                <Plus size={24} />
              </button>
            )}
            {view === 'workout' && (
              <button
                onClick={() => setShowAddExercise(!showAddExercise)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all hover:scale-105"
              >
                <Plus size={24} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setView('plans'); setSelectedPlan(null); }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'plans' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              Fichas
            </button>
            <button
              onClick={() => setView('workout')}
              disabled={!selectedPlan}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'workout' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20 disabled:opacity-50'
              }`}
            >
              Treinar
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'history' ? 'bg-purple-600 text-white' : 'bg-white/10 text-purple-300 hover:bg-white/20'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Timer de Descanso Flutuante */}
        {timerActive && (
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
                  onClick={() => { setTimerSeconds(60); setTimerRunning(true); }}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
                >
                  1min
                </button>
                <button
                  onClick={() => { setTimerSeconds(90); setTimerRunning(true); }}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
                >
                  1:30
                </button>
                <button
                  onClick={() => { setTimerSeconds(120); setTimerRunning(true); }}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm py-1 rounded"
                >
                  2min
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Adicionar Ficha */}
        {showAddPlan && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Nova Ficha de Treino</h2>
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Ex: Treino A - Peito e Tríceps"
              className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={createPlan} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl">
                Criar
              </button>
              <button onClick={() => setShowAddPlan(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Adicionar Exercício */}
        {showAddExercise && view === 'workout' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Exercício</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newExercise.name}
                onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                placeholder="Nome do exercício"
                className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
              />
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  min="1"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                  placeholder="Séries"
                  className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                />
                <input
                  type="number"
                  min="1"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                  placeholder="Reps"
                  className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newExercise.weight}
                  onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})}
                  placeholder="Kg"
                  className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={addExerciseToPlan} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl">
                  Adicionar
                </button>
                <button onClick={() => setShowAddExercise(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar */}
        {recordingExercise && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-purple-500/30 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">{recordingExercise.name}</h2>
              <p className="text-purple-300 text-sm mb-4">
                Planejado: {recordingExercise.sets}x{recordingExercise.reps} @ {recordingExercise.weight}kg
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Séries</label>
                    <input
                      type="number"
                      min="1"
                      value={recordData.sets}
                      onChange={(e) => setRecordData({...recordData, sets: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Reps</label>
                    <input
                      type="number"
                      min="1"
                      value={recordData.reps}
                      onChange={(e) => setRecordData({...recordData, reps: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Carga</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={recordData.weight}
                      onChange={(e) => setRecordData({...recordData, weight: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={recordWorkout} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl">
                    Registrar
                  </button>
                  <button onClick={() => setRecordingExercise(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Lista de Fichas */}
        {view === 'plans' && (
          <div>
            {workoutPlans.length === 0 ? (
              <div className="text-center py-16">
                <ClipboardList className="mx-auto text-purple-400/30 mb-4" size={64} />
                <p className="text-purple-300/70 text-lg">Nenhuma ficha criada</p>
                <p className="text-purple-400/50 text-sm mt-2">Clique no + para criar sua primeira ficha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-1">{plan.name}</h3>
                        <p className="text-purple-300 text-sm">{plan.exercises.length} exercícios</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectPlanForWorkout(plan)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                          Treinar <ChevronRight size={16} />
                        </button>
                        <button
                          onClick={() => duplicatePlan(plan)}
                          className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                          title="Duplicar ficha"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View: Treino */}
        {view === 'workout' && selectedPlan && (
          <div>
            {selectedPlan.exercises.length === 0 ? (
              <div className="text-center py-16">
                <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
                <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
                <p className="text-purple-400/50 text-sm mt-2">Clique no + para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPlan.exercises.map((exercise, index) => {
                  const isCompleted = completedToday.has(exercise.id);
                  const isEditing = editingExercise?.id === exercise.id;
                  const isFirst = index === 0;
                  const isLast = index === selectedPlan.exercises.length - 1;

                  return (
                    <div
                      key={exercise.id}
                      className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-all ${
                        isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-purple-500/20 hover:bg-white/15'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingExercise.name}
                            onChange={(e) => setEditingExercise({...editingExercise, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              value={editingExercise.sets}
                              onChange={(e) => setEditingExercise({...editingExercise, sets: e.target.value})}
                              className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                            />
                            <input
                              type="number"
                              value={editingExercise.reps}
                              onChange={(e) => setEditingExercise({...editingExercise, reps: e.target.value})}
                              className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                            />
                            <input
                              type="number"
                              step="0.5"
                              value={editingExercise.weight}
                              onChange={(e) => setEditingExercise({...editingExercise, weight: e.target.value})}
                              className="px-3 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={saveEditExercise} className="flex-1 bg-green-600 text-white py-2 rounded-lg">
                              <Save size={16} className="inline mr-1" /> Salvar
                            </button>
                            <button onClick={() => setEditingExercise(null)} className="flex-1 bg-white/10 text-white py-2 rounded-lg">
                              <X size={16} className="inline mr-1" /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {/* Botões de reordenação */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveExerciseUp(exercise.id)}
                              disabled={isFirst}
                              className={`p-1 rounded ${isFirst ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                              title="Mover para cima"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => moveExerciseDown(exercise.id)}
                              disabled={isLast}
                              className={`p-1 rounded ${isLast ? 'text-purple-400/30 cursor-not-allowed' : 'text-purple-400 hover:bg-purple-500/20'}`}
                              title="Mover para baixo"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>

                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg mb-1">{exercise.name}</h3>
                            <p className="text-purple-300 text-sm">
                              {exercise.sets} séries × {exercise.reps} reps @ {exercise.weight}kg
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {isCompleted ? (
                              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
                                <CheckCircle size={20} />
                                <span className="text-sm font-medium">Feito</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => startRecording(exercise)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                              >
                                Registrar
                              </button>
                            )}
                            <button
                              onClick={() => duplicateExercise(exercise)}
                              className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                              title="Duplicar exercício"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              onClick={() => setEditingExercise(exercise)}
                              className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteExercise(exercise.id)}
                              className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View: Histórico */}
        {view === 'history' && (
          <div>
            {history.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="mx-auto text-purple-400/30 mb-4" size={64} />
                <p className="text-purple-300/70 text-lg">Nenhum treino registrado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupHistoryByDate()).map(([date, records]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="text-purple-400" size={18} />
                      <h3 className="text-purple-300 font-semibold">{date}</h3>
                      <span className="text-purple-400/60 text-sm">({records.length} exercícios)</span>
                    </div>
                    <div className="space-y-3">
                      {records.map((record) => (
                        <div key={record.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-white font-semibold">{record.exerciseName}</h4>
                            <span className="text-purple-400/70 text-xs">{record.planName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-purple-400/70">Planejado:</p>
                              <p className="text-purple-300">
                                {record.plannedSets}x{record.plannedReps} @ {record.plannedWeight}kg
                              </p>
                            </div>
                            <div>
                              <p className="text-green-400/70">Realizado:</p>
                              <p className="text-green-300">
                                {record.actualSets}x{record.actualReps} @ {record.actualWeight}kg
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}