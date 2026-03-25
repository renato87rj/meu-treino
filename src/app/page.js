'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import InstallPrompt from '../components/InstallPrompt';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import RestTimer from '../components/RestTimer';
import TimerButton from '../components/TimerButton';
import PlansView from '../components/PlansView';
import WorkoutView from '../components/WorkoutView';
import HistoryView from '../components/HistoryView';

import useWorkoutData from '../hooks/useWorkoutData';
import useRestTimer from '../hooks/useRestTimer';
import { useAuth } from '../contexts/AuthContext';

export default function WorkoutTracker() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  // Hook de dados de treino - DEVE estar antes de qualquer early return
  const {
    workoutPlans,
    history,
    isSyncing,
    syncError,
    isOnline,
    createPlan,
    editPlanName,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    setProgress,
    updateExerciseWeight,
    confirmSet,
    completeExercise,
    undoExercise,
    substituteExercises,
    addSubstituteExercise,
    removeSubstituteExercise,
    getTodayRecords
  } = useWorkoutData(user?.uid || null);

  // Hook do timer de descanso - DEVE estar antes de qualquer early return
  const {
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
  } = useRestTimer(90);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08060f] relative flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Selecionar ficha para treinar
  const selectPlanForWorkout = (plan) => {
    setSelectedPlan(plan);
    setView('workout');
  };

  // Lidar com mudança de view
  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'plans') {
      setSelectedPlan(null);
    }
  };

  // Lidar com clique no botão +
  const handleAddClick = () => {
    if (view === 'plans') {
      setShowAddPlan(!showAddPlan);
    } else if (view === 'workout') {
      setShowAddExercise(!showAddExercise);
    }
  };

  // Obter registros de hoje
  const todayRecords = view === 'workout' && selectedPlan 
    ? getTodayRecords(selectedPlan.id) 
    : [];
  const completedTodayIds = new Set(todayRecords.map(r => r.exerciseId));
  const completedTodayNames = new Set(todayRecords.map(r => r.exerciseName));

  // Último registro anterior ao treino de hoje (por nome do exercício dentro do plano)
  const lastWorkoutRecordsByExerciseName = (() => {
    if (view !== 'workout' || !selectedPlan) return {};

    const today = new Date().toLocaleDateString('pt-BR');
    const entries = (history || [])
      .filter(r => r.planId === selectedPlan.id)
      .filter(r => {
        const d = new Date(r.date).toLocaleDateString('pt-BR');
        return d !== today;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const map = {};
    for (const r of entries) {
      if (!r?.exerciseName) continue;
      if (!map[r.exerciseName]) map[r.exerciseName] = r;
    }
    return map;
  })();

  return (
    <div className="min-h-screen bg-[#08060f] relative overflow-x-hidden">
      <InstallPrompt />
      
      {/* Header */}
      <Header
        view={view}
        selectedPlan={selectedPlan}
        completedCount={todayRecords.length}
        totalCount={selectedPlan?.exercises.length || 0}
        isSyncing={isSyncing}
        isOnline={isOnline}
      />

      {/* Timer de Descanso Flutuante */}
      <RestTimer
        timerActive={timerActive}
        timerSeconds={timerSeconds}
        timerRunning={timerRunning}
        timerMinimized={timerMinimized}
        timerFinished={timerFinished}
        formatTime={formatTime}
        toggleTimer={toggleTimer}
        resetTimer={resetTimer}
        closeTimer={closeTimer}
        toggleMinimize={toggleMinimize}
        dismissFinished={dismissFinished}
        setCustomTime={setCustomTime}
      />

      {/* Botão para Iniciar Timer - só aparece quando timer não está ativo */}
      {view === 'workout' && !timerActive && (
        <TimerButton
          onStartTimer={startRestTimer}
          defaultTime={defaultTime}
          onSetDefaultTime={setDefaultRestTime}
        />
      )}

      <main className="pb-24 pt-0 max-w-3xl mx-auto px-4">
        {/* View: Lista de Fichas */}
        {view === 'plans' && (
          <PlansView
            workoutPlans={workoutPlans}
            showAddPlan={showAddPlan}
            onSelectPlanForWorkout={selectPlanForWorkout}
            onEditPlanName={editPlanName}
            onDuplicatePlan={duplicatePlan}
            onDeletePlan={deletePlan}
            onCreatePlan={createPlan}
            onCancelAdd={() => setShowAddPlan(false)}
            onAddExercise={addExercise}
            onEditExercise={editExercise}
            onDeleteExercise={deleteExercise}
            onDuplicateExercise={duplicateExercise}
            onMoveExercise={moveExercise}
            onAddPlan={() => setShowAddPlan(true)}
          />
        )}

        {/* View: Treino */}
        {view === 'workout' && (
          <WorkoutView
            selectedPlan={selectedPlan}
            allPlans={workoutPlans}
            completedTodayIds={completedTodayIds}
            completedTodayNames={completedTodayNames}
            todayRecords={todayRecords}
            lastWorkoutRecordsByExerciseName={lastWorkoutRecordsByExerciseName}
            setProgress={setProgress}
            onConfirmSet={confirmSet}
            onUpdateWeight={updateExerciseWeight}
            onCompleteExercise={completeExercise}
            onUndoExercise={undoExercise}
            substituteExercises={substituteExercises[selectedPlan?.id] || []}
            onAddSubstitute={(ex) => addSubstituteExercise(selectedPlan.id, ex)}
            onRemoveSubstitute={(exId) => removeSubstituteExercise(selectedPlan.id, exId)}
            onStartRestTimer={startRestTimer}
            onFinishWorkout={() => handleViewChange('plans')}
          />
        )}

        {/* View: Histórico */}
        {view === 'history' && (
          <HistoryView
            history={history}
            workoutPlans={workoutPlans}
          />
        )}
      </main>

      <TabBar view={view} onChangeView={handleViewChange} />
    </div>
  );
}
