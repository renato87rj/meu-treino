import React, { useState } from 'react';
import { Dumbbell, CheckCircle, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';

export default function WorkoutView({ 
  selectedPlan,
  completedToday,
  todayRecords,
  onRecordWorkout,
  onEditRecord,
  onRemoveSet,
  onFinalizeExercise
}) {
  const [recordingExercise, setRecordingExercise] = useState(null);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [recordData, setRecordData] = useState({
    reps: '',
    weight: ''
  });
  const [editRecordData, setEditRecordData] = useState({
    reps: '',
    weight: ''
  });

  const startRecording = (exercise) => {
    const existingRecord = todayRecords.find(r => r.exerciseId === exercise.id);
    
    if (existingRecord && existingRecord.sets) {
      // Continuar registro existente - próxima série a registrar
      setRecordingExercise(exercise);
      setCurrentSetIndex(existingRecord.sets.length);
      setRecordData({ reps: '', weight: '' });
    } else {
      // Novo registro - começar pela primeira série
      setRecordingExercise(exercise);
      setCurrentSetIndex(0);
      setRecordData({ reps: '', weight: '' });
    }
  };

  const handleRecordSet = () => {
    if (!recordData.reps) {
      alert('Preencha as repetições');
      return;
    }

    const existingRecord = todayRecords.find(r => r.exerciseId === recordingExercise.id);
    
    if (existingRecord) {
      // Adicionar série a registro existente
      const success = onRecordWorkout(selectedPlan, recordingExercise, {
        recordId: existingRecord.id,
        setIndex: currentSetIndex,
        reps: recordData.reps,
        weight: recordData.weight
      });
      
      if (success) {
        // Fechar modal após registrar
        setRecordingExercise(null);
        setCurrentSetIndex(0);
        setRecordData({ reps: '', weight: '' });
      }
    } else {
      // Criar novo registro com primeira série
      const success = onRecordWorkout(selectedPlan, recordingExercise, {
        reps: recordData.reps,
        weight: recordData.weight
      });
      
      if (success) {
        // Fechar modal após registrar primeira série
        setRecordingExercise(null);
        setCurrentSetIndex(0);
        setRecordData({ reps: '', weight: '' });
      }
    }
  };

  const handleFinalizeExercise = () => {
    // Fechar modal e permitir continuar mesmo sem completar todas as séries
    setRecordingExercise(null);
    setCurrentSetIndex(0);
    setRecordData({ reps: '', weight: '' });
  };


  const startEditingRecord = (record) => {
    setEditingRecord(record);
    setEditingSetIndex(null);
  };

  const startEditingSet = (record, setIndex) => {
    setEditingRecord(record);
    setEditingSetIndex(setIndex);
    const set = record.sets[setIndex];
    setEditRecordData({
      reps: set.reps,
      weight: set.weight ? set.weight.toString() : ''
    });
  };

  const handleSaveEditSet = () => {
    if (!editRecordData.reps) {
      alert('Preencha as repetições');
      return;
    }

    if (onEditRecord(editingRecord.id, {
      setIndex: editingSetIndex,
      reps: editRecordData.reps,
      weight: editRecordData.weight
    })) {
      setEditingSetIndex(null);
      setEditRecordData({ reps: '', weight: '' });
    }
  };

  const handleRemoveSet = (recordId, setIndex) => {
    if (confirm('Remover esta série?')) {
      onRemoveSet(recordId, setIndex);
      if (editingSetIndex === setIndex) {
        setEditingSetIndex(null);
      }
    }
  };

  const getRecordProgress = (exercise) => {
    const record = todayRecords.find(r => r.exerciseId === exercise.id);
    if (!record || !record.sets) {
      return { completed: 0, total: exercise.sets, isComplete: false, isPartial: false };
    }
    
    const completed = record.sets.length;
    const planned = exercise.sets;
    // Compatibilidade com registros antigos (sem campo finalized)
    const finalized = record.finalized === true;
    // Considera completo se finalizado manualmente OU se completou todas as séries
    const isComplete = finalized || completed >= planned;
    const isPartial = completed > 0 && completed < planned && !finalized;
    
    return { completed, total: Math.max(completed, planned), isComplete, isPartial, finalized };
  };

  if (!selectedPlan) return null;

  const recordingRecord = recordingExercise 
    ? todayRecords.find(r => r.exerciseId === recordingExercise.id)
    : null;
  const totalPlannedSets = recordingExercise ? recordingExercise.sets : 0;
  const completedSets = recordingRecord?.sets?.length || 0;
  const canAddExtra = completedSets >= totalPlannedSets;

  return (
    <div>
      {/* Badge da Ficha */}
      <div className="bg-purple-600/20 backdrop-blur-md rounded-xl p-4 mb-6 border border-purple-500/30">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-purple-400" size={20} />
          <div>
            <p className="text-purple-300/70 text-xs">Treinando ficha</p>
            <h2 className="text-white font-semibold text-lg">{selectedPlan.name}</h2>
          </div>
        </div>
      </div>

      {/* Modal Registrar Série */}
      {recordingExercise && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-purple-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">{recordingExercise.name}</h2>
            <p className="text-purple-300 text-sm mb-1">
              Planejado: {recordingExercise.sets} x {recordingExercise.reps}
              {recordingExercise.weight && ` - ${recordingExercise.weight}kg`}
            </p>
            
            {/* Progresso */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-purple-300">
                  {canAddExtra ? 'Série Extra' : `Série ${completedSets + 1} de ${totalPlannedSets}`}
                </span>
                <span className="text-purple-400">
                  {completedSets}/{totalPlannedSets} séries completas
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div 
                  className="bg-purple-500 rounded-full h-2 transition-all"
                  style={{ width: `${Math.min((completedSets / totalPlannedSets) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Séries já registradas */}
            {recordingRecord && recordingRecord.sets && recordingRecord.sets.length > 0 && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <p className="text-purple-300 text-xs mb-2">Séries registradas:</p>
                <div className="flex flex-wrap gap-2">
                  {recordingRecord.sets.map((set, index) => (
                    <div 
                      key={index}
                      className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs"
                    >
                      {index + 1}: {set.reps}
                      {set.weight && ` ${set.weight}kg`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inputs da série atual */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Repetições</label>
                  <input
                    type="text"
                    value={recordData.reps}
                    onChange={(e) => setRecordData({...recordData, reps: e.target.value})}
                    placeholder="ex: 12 ou 8-12"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 text-sm sm:text-base"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Carga (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={recordData.weight}
                    onChange={(e) => setRecordData({...recordData, weight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={handleRecordSet} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                >
                  {canAddExtra ? (
                    <>
                      <Plus size={14} className="inline mr-1" />
                      <span className="hidden sm:inline">Adicionar Série Extra</span>
                      <span className="sm:hidden">Adicionar</span>
                    </>
                  ) : (
                    'Registrar Série'
                  )}
                </button>
                <button 
                  onClick={handleFinalizeExercise} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base"
                  type="button"
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Registro */}
      {editingRecord && editingSetIndex === null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-2">Editar Registro</h2>
            <p className="text-purple-300 text-sm mb-4">{editingRecord.exerciseName}</p>
            
            {editingRecord.sets && editingRecord.sets.length > 0 ? (
              <div className="space-y-3">
                {editingRecord.sets.map((set, index) => (
                  <div 
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-purple-500/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-purple-300 font-medium">Série {index + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingSet(editingRecord, index)}
                          className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg"
                          title="Editar série"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveSet(editingRecord.id, index)}
                          className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg"
                          title="Remover série"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-white">
                        {set.reps} repetições
                        {set.weight && <span className="text-purple-300"> {set.weight}kg</span>}
                      </p>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    // Adicionar nova série
                    setEditingSetIndex(editingRecord.sets.length);
                    setEditRecordData({ reps: '', weight: '' });
                  }}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl p-3 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Série Extra
                </button>
              </div>
            ) : (
              <p className="text-purple-300/70 text-sm">Nenhuma série registrada</p>
            )}
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setEditingRecord(null)} 
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Série Individual */}
      {editingRecord && editingSetIndex !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 max-w-md w-full mx-auto border border-purple-500/30 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Editar Série</h2>
            <p className="text-purple-300 text-sm mb-1">{editingRecord.exerciseName}</p>
            <p className="text-purple-400/70 text-xs mb-4">
              {editingSetIndex < editingRecord.sets.length 
                ? `Série ${editingSetIndex + 1}` 
                : 'Nova Série Extra'}
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Repetições</label>
                  <input
                    type="text"
                    value={editRecordData.reps}
                    onChange={(e) => setEditRecordData({...editRecordData, reps: e.target.value})}
                    placeholder="ex: 12 ou 8-12"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 text-sm sm:text-base"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-purple-200 text-sm mb-2">Carga (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={editRecordData.weight}
                    onChange={(e) => setEditRecordData({...editRecordData, weight: e.target.value})}
                    placeholder="kg"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={handleSaveEditSet} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                >
                  <Save size={14} className="inline mr-1" /> Salvar
                </button>
                <button 
                  onClick={() => {
                    setEditingSetIndex(null);
                    setEditRecordData({ reps: '', weight: '' });
                  }} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 sm:py-3 rounded-xl text-sm sm:text-base"
                >
                  <X size={14} className="inline mr-1" /> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Exercícios */}
      {selectedPlan.exercises.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum exercício nesta ficha</p>
          <p className="text-purple-400/50 text-sm mt-2">Adicione exercícios na aba Fichas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedPlan.exercises.map((exercise) => {
            const record = todayRecords.find(r => r.exerciseId === exercise.id);
            const progress = getRecordProgress(exercise);
            const hasRecord = !!record && record.sets && record.sets.length > 0;

            return (
              <div
                key={exercise.id}
                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border transition-all ${
                  progress.isComplete 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : progress.isPartial
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-purple-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg mb-1 break-words">{exercise.name}</h3>
                    <p className="text-purple-300 text-sm mb-1">
                      Planejado: {exercise.sets} x {exercise.reps}
                      {exercise.weight && ` - ${exercise.weight}kg`}
                    </p>
                    
                    {hasRecord && (
                      <div className="mt-2">
                        <p className={`text-sm font-medium ${
                          progress.isComplete ? 'text-green-300' : 'text-yellow-300'
                        }`}>
                          {progress.completed}/{progress.total} séries registradas
                        </p>
                        {record.sets && record.sets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.sets.slice(0, 3).map((set, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-white/10 text-purple-200 px-2 py-0.5 rounded"
                              >
                                {set.reps}
                                {set.weight && `${set.weight}kg`}
                              </span>
                            ))}
                            {record.sets.length > 3 && (
                              <span className="text-xs text-purple-300/70 px-2 py-0.5">
                                +{record.sets.length - 3} mais
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {progress.isComplete ? (
                      <>
                        <div className="bg-green-500/20 text-green-400 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2">
                          <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Completo</span>
                        </div>
                        <button
                          onClick={() => startEditingRecord(record)}
                          className="text-purple-400 hover:bg-purple-500/20 p-2 rounded-lg flex-shrink-0"
                          title="Editar registro"
                        >
                          <Edit2 size={18} />
                        </button>
                      </>
                    ) : progress.isPartial ? (
                      <>
                        <div className="bg-yellow-500/20 text-yellow-400 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Em progresso</span>
                        </div>
                        <button
                          onClick={() => startRecording(exercise)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap"
                        >
                          Continuar
                        </button>
                        <button
                          onClick={() => {
                            const record = todayRecords.find(r => r.exerciseId === exercise.id);
                            if (record) {
                              onFinalizeExercise(record.id);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap"
                          title="Finalizar exercício mesmo sem completar todas as séries"
                        >
                          Finalizar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startRecording(exercise)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap"
                      >
                        Registrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
