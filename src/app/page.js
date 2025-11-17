'use client';

import React, { useState } from 'react';

import InstallPrompt from '../components/InstallPrompt';
import Header from '../components/Header';
import RestTimer from '../components/RestTimer';
import PlansView from '../components/PlansView';
import WorkoutView from '../components/WorkoutView';
import HistoryView from '../components/HistoryView';

import useWorkoutData from '../hooks/useWorkoutData';
import useRestTimer from '../hooks/useRestTimer';

export default function WorkoutTracker() {
  const [view, setView] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  // Hook de dados de treino
  const {
    workoutPlans,
    history,
    createPlan,
    editPlanName,
    duplicatePlan,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    duplicateExercise,
    moveExercise,
    recordWorkout,
    getTodayRecords,
    editRecord,
    groupHistoryByDate
  } = useWorkoutData();

  // Hook do timer de descanso
  const {
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
  } = useRestTimer(90);

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

  // Registrar treino e iniciar timer
  const handleRecordWorkout = (plan, exercise, recordData) => {
    const success = recordWorkout(plan, exercise, recordData);
    if (success) {
      startRestTimer();
    }
    return success;
  };

  // Obter registros de hoje
  const todayRecords = view === 'workout' && selectedPlan 
    ? getTodayRecords(selectedPlan.id) 
    : [];
  const completedToday = new Set(todayRecords.map(r => r.exerciseId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <InstallPrompt />
      
      {/* Header com navegação */}
      <Header
        view={view}
        selectedPlan={selectedPlan}
        todayRecordsCount={todayRecords.length}
        totalExercises={selectedPlan?.exercises.length || 0}
        onAddClick={handleAddClick}
        onViewChange={handleViewChange}
        timerActive={timerActive}
        defaultTime={defaultTime}
        onSetDefaultTime={setDefaultRestTime}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Timer de Descanso Flutuante */}
        <RestTimer
          timerActive={timerActive}
          timerSeconds={timerSeconds}
          timerRunning={timerRunning}
          timerMinimized={timerMinimized}
          formatTime={formatTime}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          closeTimer={closeTimer}
          toggleMinimize={toggleMinimize}
          setCustomTime={setCustomTime}
        />

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
          />
        )}

        {/* View: Treino */}
        {view === 'workout' && (
          <WorkoutView
            selectedPlan={selectedPlan}
            completedToday={completedToday}
            todayRecords={todayRecords}
            onRecordWorkout={handleRecordWorkout}
            onEditRecord={editRecord}
          />
        )}

        {/* View: Histórico */}
        {view === 'history' && (
          <HistoryView
            history={history}
            groupHistoryByDate={groupHistoryByDate}
          />
        )}
      </div>
    </div>
  );
}
