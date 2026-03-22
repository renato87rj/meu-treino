import React from 'react';
import { Calendar, Dumbbell } from 'lucide-react';

export default function HistoryView({ history, groupHistoryByDate }) {
  const groupedHistory = groupHistoryByDate();

  // Agrupar exercícios por data e depois por ficha (usando planId para garantir agrupamento correto)
  const groupByDateAndPlan = () => {
    const grouped = {};
    
    Object.entries(groupedHistory).forEach(([date, records]) => {
      // Agrupar por planId primeiro
      const planGroups = records.reduce((acc, record) => {
        const planKey = record.planId || record.planName; // Usa planId como chave primária
        if (!acc[planKey]) {
          acc[planKey] = {
            planId: record.planId,
            planName: record.planName,
            records: []
          };
        }
        acc[planKey].records.push(record);
        return acc;
      }, {});
      
      grouped[date] = planGroups;
    });
    
    return grouped;
  };

  const groupedByDateAndPlan = groupByDateAndPlan();


  return (
    <div>
      {history.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto text-purple-400/30 mb-4" size={64} />
          <p className="text-purple-300/70 text-lg">Nenhum treino registrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDateAndPlan).map(([date, planGroups]) => {
            const totalExercises = Object.values(planGroups).reduce((sum, group) => sum + group.records.length, 0);
            
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-purple-400" size={18} />
                  <h3 className="text-purple-300 font-semibold">{date}</h3>
                  <span className="text-purple-400/60 text-sm">({totalExercises} exercícios)</span>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(planGroups).map(([planKey, planGroup]) => (
                    <div key={`${date}-${planKey}`} className="space-y-3">
                      {/* Header da Ficha */}
                      <div className="flex items-center gap-2 bg-purple-600/20 backdrop-blur-md rounded-lg px-3 py-2 border border-purple-500/30">
                        <Dumbbell className="text-purple-400" size={16} />
                        <span className="text-purple-200 font-medium text-sm">{planGroup.planName}</span>
                        <span className="text-purple-400/70 text-xs ml-auto">
                          {planGroup.records.length} {planGroup.records.length === 1 ? 'exercício' : 'exercícios'}
                        </span>
                      </div>
                      
                      {/* Lista de Exercícios da Ficha */}
                      <div className="space-y-2 ml-4">
                        {planGroup.records.map((record) => (
                          <div 
                            key={record.id} 
                            className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-semibold">{record.exerciseName}</h4>
                              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-medium">
                                ✓ Feito
                              </span>
                            </div>

                            {/* Carga utilizada */}
                            {record.weight != null && (
                              <p className="text-purple-300 text-sm mb-2">
                                Carga: <span className="text-white font-medium">{record.weight} kg</span>
                              </p>
                            )}

                            {/* Séries realizadas */}
                            {record.completedSets && record.completedSets.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {record.completedSets.map((set, i) => (
                                  <span
                                    key={i}
                                    className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-2 py-1 rounded-md"
                                  >
                                    S{i + 1}: {set?.reps != null ? `${set.reps} reps` : '—'}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {/* Planejado */}
                            <p className="text-purple-400/50 text-xs">
                              Planejado: {record.plannedSets} x {record.plannedReps}
                              {record.plannedWeight ? ` · ${record.plannedWeight} kg` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

