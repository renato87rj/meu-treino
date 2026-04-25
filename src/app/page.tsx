'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan } from '../types/workout';

import InstallPrompt from '../components/ui/InstallPrompt';
import Header from '../components/ui/Header';
import TabBar from '../components/ui/TabBar';
import RestTimer from '../components/features/RestTimer';
import TimerButton from '../components/features/TimerButton';
import ProgramsView from '../components/features/ProgramsView';
import WorkoutView from '../components/features/WorkoutView';
import HistoryView from '../components/features/HistoryView';
import EvolutionView from '../components/features/EvolutionView';

import useWorkoutData from '../hooks/useWorkoutData';
import useRestTimer from '../hooks/useRestTimer';
import useFinishedPlans from '../hooks/useFinishedPlans';
import useWorkoutDerivedState from '../hooks/useWorkoutDerivedState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function WorkoutTracker() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [view, setView] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);

  const { isFinished, setWorkoutFinished: setFinished } = useFinishedPlans();

  // Hook de dados de treino - DEVE estar antes de qualquer early return
  const {
    workoutPrograms,
    workoutPlans,
    history,
    draft,
    showDraftModal,
    isSyncing,
    syncError,
    isOnline,
    permanentFailures,
    createProgram,
    editProgramName,
    archiveProgram,
    unarchiveProgram,
    deleteProgram,
    setActiveProgram,
    createPlan,
    editPlanName,
    deletePlan,
    addExercise,
    editExercise,
    deleteExercise,
    setProgress,
    updateExerciseWeight,
    confirmSet,
    unconfirmSet,
    completeExercise,
    undoExercise,
    substituteExercises,
    addSubstituteExercise,
    removeSubstituteExercise,
    getTodayRecords,
    getDraftRecords,
    startWorkout,
    commitSession,
    discardDraft,
    resumeDraft,
  } = useWorkoutData(user?.uid || null);

  useEffect(() => {
    if (permanentFailures > 0) {
      showToast('Algumas alterações não puderam ser sincronizadas com o servidor.', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permanentFailures]);

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

  const isDraftActive = draft !== null;

  const { todayRecords, completedTodayIds, completedTodayNames, lastWorkoutRecordsByExerciseName } = useWorkoutDerivedState(
    view, selectedPlan, history, getTodayRecords, getDraftRecords, isDraftActive
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Ao confirmar "Continuar" no modal de rascunho, vai para a aba workout
  const prevShowDraftModal = React.useRef(showDraftModal);
  React.useEffect(() => {
    if (prevShowDraftModal.current && !showDraftModal && draft) {
      const plan = workoutPlans.find(p => p.id === draft.planId);
      if (plan) {
        setSelectedPlan(plan);
        setView('workout');
      }
    }
    prevShowDraftModal.current = showDraftModal;
  }, [showDraftModal, draft, workoutPlans]);

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
    if (draft) {
      const draftPlan = workoutPlans.find(p => p.id === draft.planId);
      if (draftPlan) setSelectedPlan(draftPlan);
      setView('workout');
      return;
    }
    setSelectedPlan(plan);
    startWorkout(plan);
    setView('workout');
  };

  const handleViewChange = (newView: string) => {
    if (newView === 'workout' && !isDraftActive) return;
    setView(newView);
    if (newView === 'plans' && !isDraftActive) {
      setSelectedPlan(null);
    }
  };

  const handleFinishWorkout = async () => {
    await commitSession();
    setWorkoutFinished(true);
    handleViewChange('plans');
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-[#08060f] relative overflow-x-hidden">
      <InstallPrompt />

      {/* Modal de recuperação de rascunho */}
      {showDraftModal && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-[20px] p-6 border border-purple-500/20"
               style={{ background: 'rgba(18, 14, 30, 0.98)' }}>
            <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <span className="text-[20px]">⏱️</span>
            </div>
            <h2 className="text-[17px] font-bold text-white mb-1">Treino em andamento</h2>
            <p className="text-[13px] text-[#7c6f9e] mb-5">
              Você tem um treino de <span className="text-purple-300 font-semibold">{draft.planName}</span> em andamento. Deseja continuar ou descartar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={discardDraft}
                className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-[#7c6f9e] border border-white/10 active:scale-95 transition-transform">
                Descartar
              </button>
              <button
                onClick={resumeDraft}
                className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-white bg-purple-600 active:scale-95 transition-transform">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      
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
        {/* View: Programas/Treinos */}
        {view === 'plans' && (
          <ProgramsView
            workoutPrograms={workoutPrograms}
            workoutPlans={workoutPlans}
            draft={draft}
            onCreateProgram={createProgram}
            onEditProgramName={editProgramName}
            onArchiveProgram={archiveProgram}
            onUnarchiveProgram={unarchiveProgram}
            onDeleteProgram={deleteProgram}
            onSetActiveProgram={setActiveProgram}
            onCreatePlan={createPlan}
            onEditPlanName={editPlanName}
            onDeletePlan={deletePlan}
            onAddExercise={addExercise}
            onEditExercise={editExercise}
            onDeleteExercise={deleteExercise}
            onSelectPlanForWorkout={selectPlanForWorkout}
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
            draftStartedAt={draft?.startedAt ?? null}
            onConfirmSet={confirmSet}
            onUnconfirmSet={unconfirmSet}
            onUpdateWeight={updateExerciseWeight}
            onCompleteExercise={completeExercise}
            onUndoExercise={undoExercise}
            substituteExercises={selectedPlan ? substituteExercises[selectedPlan.id] || [] : []}
            onAddSubstitute={(ex: import('../types/workout').Exercise) => addSubstituteExercise(selectedPlan!.id, ex)}
            onRemoveSubstitute={(exId: string) => removeSubstituteExercise(selectedPlan!.id, exId)}
            onStartRestTimer={startRestTimer}
            onFinishWorkout={handleFinishWorkout}
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

        {/* View: Evolução */}
        {view === 'evolution' && (
          <EvolutionView
            history={history}
            workoutPlans={workoutPlans}
          />
        )}
      </main>

      <TabBar view={view} onChangeView={handleViewChange} workoutActive={isDraftActive} />
    </div>
  );
}
