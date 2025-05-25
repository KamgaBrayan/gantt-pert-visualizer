// src/components/diagrams/ProjectInfo.tsx - VERSION PROFESSIONNELLE AMÉLIORÉE

'use client';

import React, { useMemo } from 'react';
import { Task } from '@/lib/types';
import { formatDuration, calculateProjectStats } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface ProjectInfoProps {
  tasks: Task[];
  criticalPath?: string[];
  projectDuration?: number;
}

interface ProjectAnalysis {
  efficiency: number;
  parallelization: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export default function ProjectInfo({
                                      tasks,
                                      criticalPath = [],
                                      projectDuration = 0
                                    }: ProjectInfoProps) {

  // Calculs memoized pour les performances
  const projectStats = useMemo(() => calculateProjectStats(tasks), [tasks]);

  const criticalTasks = useMemo(() =>
          tasks.filter(task => criticalPath.includes(task.id))
      , [tasks, criticalPath]);

  const analysis = useMemo(() => analyzeProject(tasks, criticalPath, projectDuration), [tasks, criticalPath, projectDuration]);

  // Trouver les tâches importantes
  const longestTask = useMemo(() =>
          tasks.reduce((longest, task) =>
                  task.duration > longest.duration ? task : longest,
              { id: '', name: '', duration: 0, predecessors: [] }
          )
      , [tasks]);

  const mostDependentTask = useMemo(() =>
          tasks.reduce((most, task) =>
                  task.predecessors.length > most.predecessors.length ? task : most,
              { id: '', name: '', duration: 0, predecessors: [] }
          )
      , [tasks]);

  const bottleneckTasks = useMemo(() => {
    // Tâches qui bloquent le plus d'autres tâches
    const successorCount = new Map<string, number>();

    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        successorCount.set(predId, (successorCount.get(predId) || 0) + 1);
      });
    });

    return tasks
        .filter(task => (successorCount.get(task.id) || 0) > 0)
        .sort((a, b) => (successorCount.get(b.id) || 0) - (successorCount.get(a.id) || 0))
        .slice(0, 3)
        .map(task => ({
          ...task,
          successorCount: successorCount.get(task.id) || 0
        }));
  }, [tasks]);

  // Calculer les jalons (tâches sans successeurs)
  const milestones = useMemo(() => {
    const hasPredecessor = new Set<string>();
    tasks.forEach(task => {
      task.predecessors.forEach(predId => hasPredecessor.add(predId));
    });

    return tasks.filter(task => !hasPredecessor.has(task.id));
  }, [tasks]);

  return (
      <div className="space-y-6">
        {/* Vue d'ensemble du projet */}
        <Card title="🎯 Vue d'ensemble du projet" className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Durée totale</h4>
                  <p className="text-2xl font-bold text-blue-600">{formatDuration(projectDuration)}</p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">Tâches totales</h4>
                  <p className="text-2xl font-bold text-green-600">{projectStats.totalTasks}</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg font-bold text-red-600">{projectStats.criticalTasks}</div>
              <div className="text-xs text-gray-600">Tâches critiques</div>
            </div>

            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg font-bold text-orange-600">{projectStats.criticalPathPercentage}%</div>
              <div className="text-xs text-gray-600">% critique</div>
            </div>

            <div className="bg-white p-3 rounded-lg text-center shadow-sm">
              <div className="text-lg font-bold text-purple-600">{projectStats.avgTaskDuration}j</div>
              <div className="text-xs text-gray-600">Durée moy.</div>
            </div>
          </div>
        </Card>

        {/* Chemin critique */}
        <Card title="🔴 Chemin critique" className="border-red-200">
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-800">Durée du chemin critique</h4>
              <p className="text-xl font-bold text-red-600">{formatDuration(projectDuration)}</p>
            </div>

            <div className="flex items-center space-x-2 text-sm text-red-700">
              <span>⚠️</span>
              <span>Tout retard sur ces tâches retardera le projet entier</span>
            </div>
          </div>

          {criticalTasks.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Séquence critique ({criticalTasks.length} tâches):
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    {criticalPath.map((taskId, index) => {
                      const task = tasks.find(t => t.id === taskId);
                      return (
                          <React.Fragment key={taskId}>
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                              {task?.name || taskId} ({task?.duration}j)
                            </div>
                            {index < criticalPath.length - 1 && (
                                <span className="text-gray-400">→</span>
                            )}
                          </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
          ) : (
              <p className="text-gray-500 text-sm italic">Aucun chemin critique identifié</p>
          )}
        </Card>

        {/* Analyse des risques */}
        <Card title="⚡ Analyse des risques" className={`border-${getRiskColor(analysis.riskLevel)}-200`}>
          <div className={`bg-${getRiskColor(analysis.riskLevel)}-50 p-4 rounded-lg mb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Niveau de risque</h4>
                <p className={`text-lg font-bold text-${getRiskColor(analysis.riskLevel)}-600`}>
                  {getRiskLabel(analysis.riskLevel)}
                </p>
              </div>
              <div className="text-2xl">
                {analysis.riskLevel === 'high' ? '🔴' : analysis.riskLevel === 'medium' ? '🟡' : '🟢'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700">Efficacité</h5>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className={`bg-${getEfficiencyColor(analysis.efficiency)}-500 h-2 rounded-full`}
                        style={{ width: `${analysis.efficiency}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analysis.efficiency}%</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700">Parallélisation</h5>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                        className={`bg-${getEfficiencyColor(analysis.parallelization)}-500 h-2 rounded-full`}
                        style={{ width: `${analysis.parallelization}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{analysis.parallelization}%</span>
                </div>
              </div>
            </div>

            {analysis.recommendations.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">💡 Recommandations:</h5>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                    ))}
                  </ul>
                </div>
            )}
          </div>
        </Card>

        {/* Tâches importantes */}
        <Card title="🎯 Tâches importantes">
          <div className="space-y-4">
            {/* Tâche la plus longue */}
            {longestTask.name && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-1">🕐 Tâche la plus longue</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">{longestTask.name}</span>
                    <span className="text-sm font-bold text-blue-600">{formatDuration(longestTask.duration)}</span>
                  </div>
                </div>
            )}

            {/* Tâche avec le plus de dépendances */}
            {mostDependentTask.name && mostDependentTask.predecessors.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-orange-800 mb-1">🔗 Plus de dépendances</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-orange-700">{mostDependentTask.name}</span>
                    <span className="text-sm font-bold text-orange-600">
                  {mostDependentTask.predecessors.length} dépendance{mostDependentTask.predecessors.length > 1 ? 's' : ''}
                </span>
                  </div>
                </div>
            )}

            {/* Goulots d'étranglement */}
            {bottleneckTasks.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <h5 className="text-sm font-medium text-red-800 mb-2">🚧 Goulots d'étranglement</h5>
                  <div className="space-y-1">
                    {bottleneckTasks.map(task => (
                        <div key={task.id} className="flex justify-between items-center text-sm">
                          <span className="text-red-700">{task.name}</span>
                          <span className="text-red-600 font-medium">
                      {task.successorCount} tâche{task.successorCount > 1 ? 's' : ''} dépendante{task.successorCount > 1 ? 's' : ''}
                    </span>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>
        </Card>

        {/* Jalons du projet */}
        {milestones.length > 0 && (
            <Card title="🏁 Jalons du projet">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  Tâches finales qui marquent des étapes importantes du projet
                </p>
                {milestones.map(milestone => (
                    <div key={milestone.id} className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-green-800">{milestone.name}</span>
                          <div className="text-xs text-green-600">
                            Fin prévue: Jour {milestone.end || 'N/A'}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                    Jalon
                  </span>
                      </div>
                    </div>
                ))}
              </div>
            </Card>
        )}

        {/* Statistiques détaillées */}
        <Card title="📊 Statistiques détaillées">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">Répartition des tâches</h5>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durée moyenne:</span>
                  <span className="font-medium">{projectStats.avgTaskDuration} jours</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total jours-personnes:</span>
                  <span className="font-medium">{projectStats.totalWorkDays} jours</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tâches en parallèle:</span>
                  <span className="font-medium">
                  {calculateParallelTasks(tasks)} maximum
                </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">Répartition par durée</h5>

              <div className="space-y-2">
                {getDurationDistribution(tasks).map(({ range, count, percentage }) => (
                    <div key={range} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{range}:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}

// Fonctions utilitaires pour l'analyse

function analyzeProject(tasks: Task[], criticalPath: string[], projectDuration: number): ProjectAnalysis {
  const totalWorkDays = tasks.reduce((sum, task) => sum + task.duration, 0);
  const efficiency = Math.round((totalWorkDays / (projectDuration * tasks.length)) * 100);

  // Calcul de la parallélisation (pourcentage de tâches pouvant être exécutées en parallèle)
  const maxParallelTasks = calculateParallelTasks(tasks);
  const parallelization = Math.round((maxParallelTasks / tasks.length) * 100);

  // Évaluation du niveau de risque
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const criticalPercentage = (criticalPath.length / tasks.length) * 100;

  if (criticalPercentage > 70 || efficiency < 50) {
    riskLevel = 'high';
  } else if (criticalPercentage > 50 || efficiency < 70) {
    riskLevel = 'medium';
  }

  // Génération des recommandations
  const recommendations: string[] = [];

  if (criticalPercentage > 60) {
    recommendations.push("Cherchez à réduire les dépendances pour diminuer le chemin critique");
  }

  if (efficiency < 60) {
    recommendations.push("Optimisez la parallélisation des tâches pour améliorer l'efficacité");
  }

  if (parallelization < 30) {
    recommendations.push("Identifiez les tâches qui peuvent être exécutées en parallèle");
  }

  const longestTask = Math.max(...tasks.map(t => t.duration));
  const avgDuration = totalWorkDays / tasks.length;

  if (longestTask > avgDuration * 3) {
    recommendations.push("Divisez les tâches très longues en sous-tâches plus petites");
  }

  if (recommendations.length === 0) {
    recommendations.push("Planification bien équilibrée, bon travail !");
  }

  return {
    efficiency,
    parallelization,
    riskLevel,
    recommendations
  };
}

function calculateParallelTasks(tasks: Task[]): number {
  // Calculer le nombre maximum de tâches pouvant s'exécuter en parallèle
  const timeSlots = new Map<number, number>();

  tasks.forEach(task => {
    const start = task.start || 0;
    const end = task.end || start + task.duration;

    for (let time = start; time < end; time++) {
      timeSlots.set(time, (timeSlots.get(time) || 0) + 1);
    }
  });

  return Math.max(...Array.from(timeSlots.values()), 0);
}

function getDurationDistribution(tasks: Task[]) {
  const ranges = [
    { range: "1-2 jours", min: 1, max: 2 },
    { range: "3-5 jours", min: 3, max: 5 },
    { range: "6-10 jours", min: 6, max: 10 },
    { range: "11+ jours", min: 11, max: Infinity }
  ];

  return ranges.map(({ range, min, max }) => {
    const count = tasks.filter(task => task.duration >= min && task.duration <= max).length;
    const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;

    return { range, count, percentage };
  });
}

function getRiskColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'gray';
  }
}

function getRiskLabel(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'high': return 'Élevé';
    case 'medium': return 'Modéré';
    case 'low': return 'Faible';
    default: return 'Inconnu';
  }
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 80) return 'green';
  if (efficiency >= 60) return 'yellow';
  return 'red';
}