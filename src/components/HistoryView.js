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

  // Formatar resumo consolidado das séries
  const formatSetsSummary = (record) => {
    // Compatibilidade com registros antigos
    if (record.actualSets && !record.sets) {
      return `${record.actualSets} x ${record.actualReps}${record.actualWeight ? ` ${record.actualWeight}kg` : ''}`;
    }

    // Novo formato com array de séries
    if (!record.sets || record.sets.length === 0) {
      return 'Nenhuma série registrada';
    }

    const sets = record.sets;
    const totalSets = sets.length;

    // Verificar se todas as séries têm a mesma carga
    const allSameWeight = sets.every(set => 
      set.weight === sets[0].weight || (!set.weight && !sets[0].weight)
    );
    const commonWeight = sets[0].weight;

    if (allSameWeight && commonWeight) {
      // Formato: "4 séries: 12, 10, 8, 8 reps 20kg"
      const repsList = sets.map(s => s.reps).join(', ');
      return `${totalSets} séries: ${repsList} reps ${commonWeight}kg`;
    } else if (allSameWeight && !commonWeight) {
      // Todas sem carga: "4 séries: 12, 10, 8, 8 reps"
      const repsList = sets.map(s => s.reps).join(', ');
      return `${totalSets} séries: ${repsList} reps`;
    } else {
      // Cargas diferentes: "4 séries: 12x20kg, 10x20kg, 8x18kg, 8x18kg"
      const setsList = sets.map(set => 
        `${set.reps}${set.weight ? `x${set.weight}kg` : ''}`
      ).join(', ');
      return `${totalSets} séries: ${setsList}`;
    }
  };

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
                            <h4 className="text-white font-semibold mb-3">{record.exerciseName}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-purple-400/70 mb-1">Planejado:</p>
                                <p className="text-purple-300">
                                  {record.plannedSets} x {record.plannedReps}
                                </p>
                              </div>
                              <div>
                                <p className="text-green-400/70 mb-1">Realizado:</p>
                                <p className="text-green-300 text-sm">
                                  {formatSetsSummary(record)}
                                </p>
                              </div>
                            </div>
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

