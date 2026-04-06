'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '../types/workout';

import InstallPrompt from '../components/ui/InstallPrompt';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import RestTimer from '../components/features/RestTimer';
import TimerButton from '../components/features/TimerButton';
import PlansView from '../components/features/PlansView';
import WorkoutView from '../components/features/WorkoutView';
import HistoryView from '../components/features/HistoryView';

import useWorkoutData from '../hooks/useWorkoutData';
import useRestTimer from '../hooks/useRestTimer';
import useFinishedPlans from '../hooks/useFinishedPlans';
import useWorkoutDerivedState from '../hooks/useWorkoutDerivedState';
import { useAuth } from '../contexts/AuthContext';

export default function WorkoutTracker() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const { isFinished, setWorkoutFinished: setFinished } = useFinishedPlans();

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
    unconfirmSet,
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

  const { todayRecords, completedTodayIds, completedTodayNames, lastWorkoutRecordsByExerciseName } = useWorkoutDerivedState(view, selectedPlan, history, getTodayRecords);

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

  const workoutFinished = selectedPlan ? isFinished(selectedPlan.id) : false;
  const setWorkoutFinished = (finished: boolean) => selectedPlan && setFinished(selectedPlan.id, finished);

  const selectPlanForWorkout = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setView('workout');
  };

  const handleViewChange = (newView: string) => {
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
            onUnconfirmSet={unconfirmSet}
            onUpdateWeight={updateExerciseWeight}
            onCompleteExercise={completeExercise}
            onUndoExercise={undoExercise}
            substituteExercises={selectedPlan ? substituteExercises[selectedPlan.id] || [] : []}
            onAddSubstitute={(ex: import('../types/workout').Exercise) => addSubstituteExercise(selectedPlan!.id, ex)}
            onRemoveSubstitute={(exId: string) => removeSubstituteExercise(selectedPlan!.id, exId)}
            onStartRestTimer={startRestTimer}
            onFinishWorkout={() => handleViewChange('plans')}
            workoutFinished={workoutFinished}
            setWorkoutFinished={setWorkoutFinished}
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
