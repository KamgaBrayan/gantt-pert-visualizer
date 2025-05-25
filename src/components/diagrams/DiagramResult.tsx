// src/components/diagrams/DiagramResult.tsx - VERSION CORRIGÉE

'use client';

import React, { useState } from 'react';
import { Task, DiagramType, DiagramData } from '@/lib/types';
import { exportToJSON, exportToCSV, formatDuration } from '@/lib/utils'; // ✅ Import ajouté
import GanttChart from './GanttChart';
import PertChart from './PertChart';
import ProjectInfo from './ProjectInfo';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface DiagramResultProps {
  diagramData: DiagramData;
  diagramType: DiagramType;
  onNewDiagram: () => void;
  onEditTasks: (tasks: Task[]) => void;
}

export default function DiagramResult({
                                        diagramData,
                                        diagramType,
                                        onNewDiagram,
                                        onEditTasks
                                      }: DiagramResultProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { tasks, criticalPath = [], projectDuration = 0 } = diagramData;

  // Trouver la tâche sélectionnée
  const selectedTask = selectedTaskId
      ? tasks.find(task => task.id === selectedTaskId)
      : null;

  // Gérer le clic sur une tâche
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  // ✅ CORRECTION: Fonction d'export améliorée avec gestion d'erreurs
  const handleExport = (format: 'json' | 'csv') => {
    try {
      let content = '';
      let fileName = '';
      let mimeType = '';

      if (format === 'json') {
        content = exportToJSON(tasks);
        fileName = `gantt-pert-project-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        content = exportToCSV(tasks);
        fileName = `gantt-pert-project-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }

      // Créer un blob et déclencher le téléchargement
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`✅ Export ${format.toUpperCase()} réussi: ${fileName}`);

    } catch (error) {
      console.error(`❌ Erreur lors de l'export ${format}:`, error);
      alert(`Erreur lors de l'export ${format.toUpperCase()}. Vérifiez la console pour plus de détails.`);
    }
  };

  // ✅ CORRECTION: Génération des onglets avec gestion d'erreurs
  const generateDiagramTabs = () => {
    const tabItems = [];

    if (diagramType === DiagramType.GANTT || diagramType === DiagramType.BOTH) {
      tabItems.push({
        id: 'gantt',
        label: `📊 Diagramme de GANTT (${tasks.length} tâches)`,
        content: (
            <div className="mt-4">
              <GanttChart
                  tasks={tasks}
                  criticalPath={criticalPath}
                  height={Math.max(500, tasks.length * 60 + 100)} // ✅ Hauteur adaptative
                  onTaskClick={handleTaskClick}
              />
            </div>
        )
      });
    }

    if (diagramType === DiagramType.PERT || diagramType === DiagramType.BOTH) {
      tabItems.push({
        id: 'pert',
        label: `🔄 Diagramme de PERT (${criticalPath.length} critiques)`,
        content: (
            <div className="mt-4">
              <PertChart
                  tasks={tasks}
                  criticalPath={criticalPath}
                  height={Math.max(600, tasks.length * 80 + 150)} // ✅ Hauteur adaptative
                  onTaskClick={handleTaskClick}
              />
            </div>
        )
      });
    }

    return tabItems;
  };

  // ✅ Calculer les statistiques du projet
  const projectStats = {
    totalTasks: tasks.length,
    criticalTasks: tasks.filter(t => t.isCritical).length,
    completionTime: projectDuration,
    averageTaskDuration: Math.round((tasks.reduce((sum, t) => sum + t.duration, 0) / tasks.length) * 10) / 10,
    criticalPathPercentage: Math.round((tasks.filter(t => t.isCritical).length / tasks.length) * 100)
  };

  return (
      <div className="space-y-6">
        {/* ✅ En-tête amélioré avec statistiques */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎯 Résultat du Projet
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div className="bg-white p-2 rounded shadow-sm">
                  <div className="font-medium text-gray-600">Durée totale</div>
                  <div className="text-lg font-bold text-blue-600">{projectDuration} jours</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm">
                  <div className="font-medium text-gray-600">Tâches</div>
                  <div className="text-lg font-bold text-green-600">{projectStats.totalTasks}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm">
                  <div className="font-medium text-gray-600">Critiques</div>
                  <div className="text-lg font-bold text-red-600">{projectStats.criticalTasks}</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm">
                  <div className="font-medium text-gray-600">% Critique</div>
                  <div className="text-lg font-bold text-orange-600">{projectStats.criticalPathPercentage}%</div>
                </div>
                <div className="bg-white p-2 rounded shadow-sm">
                  <div className="font-medium text-gray-600">Durée moy.</div>
                  <div className="text-lg font-bold text-purple-600">{projectStats.averageTaskDuration}j</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {/* ✅ Menu d'export amélioré */}
              {/* Remplacer le dropdown par ceci */}
              <div className="relative inline-block">
                <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <span>📥 Exporter</span>
                </Button>

                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                      <button
                          onClick={() => { handleExport('json'); setShowExportMenu(false); }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center space-x-2"
                      >
                        <span>📄 JSON</span>
                      </button>
                      <button
                          onClick={() => { handleExport('csv'); setShowExportMenu(false); }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center space-x-2"
                      >
                        <span>📊 CSV</span>
                      </button>
                    </div>
                )}
              </div>

              <Button
                  onClick={() => onEditTasks(tasks)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Modifier</span>
              </Button>

              <Button
                  onClick={onNewDiagram}
                  variant="primary"
                  size="sm"
                  className="flex items-center space-x-2"
              >
                <span>🆕</span>
                <span>Nouveau</span>
              </Button>
            </div>
          </div>

          {/* ✅ Chemin critique visible */}
          {criticalPath.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-1">🔴 Chemin Critique:</h4>
                <div className="text-red-700 font-mono text-sm">
                  {criticalPath.join(' → ')}
                </div>
              </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <Tabs tabs={generateDiagramTabs()} />
            </Card>
          </div>

          <div>
            <div className="space-y-6">
              <ProjectInfo
                  tasks={tasks}
                  criticalPath={criticalPath}
                  projectDuration={projectDuration}
              />

              {/* ✅ Détails de la tâche sélectionnée améliorés */}
              {selectedTask && (
                  <Card title={`🔍 Détails: ${selectedTask.name}`}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <h4 className="text-sm font-medium text-gray-700">Durée</h4>
                          <p className="text-lg font-bold text-blue-600">{formatDuration(selectedTask.duration)}</p>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <h4 className="text-sm font-medium text-gray-700">Période</h4>
                          <p className="text-sm text-gray-800">J{selectedTask.start} → J{selectedTask.end}</p>
                        </div>
                      </div>

                      {selectedTask.slack !== undefined && (
                          <div className={`p-3 rounded ${selectedTask.isCritical ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            <h4 className="text-sm font-medium text-gray-700">Marge de manœuvre</h4>
                            <p className={`text-lg font-bold ${selectedTask.isCritical ? 'text-red-600' : 'text-green-600'}`}>
                              {selectedTask.slack === 0 ? 'Aucune marge' : `${selectedTask.slack} jour${selectedTask.slack !== 1 ? 's' : ''}`}
                            </p>
                          </div>
                      )}

                      {selectedTask.predecessors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">🔗 Dépendances</h4>
                            <div className="space-y-1">
                              {selectedTask.predecessors.map(predId => {
                                const pred = tasks.find(t => t.id === predId);
                                return (
                                    <div
                                        key={predId}
                                        className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm cursor-pointer hover:bg-gray-100"
                                        onClick={() => setSelectedTaskId(predId)}
                                    >
                                      <span>{pred ? pred.name : predId}</span>
                                      <span className="text-gray-500">({predId})</span>
                                    </div>
                                );
                              })}
                            </div>
                          </div>
                      )}

                      {/* ✅ Successeurs */}
                      {(() => {
                        const successors = tasks.filter(t => t.predecessors.includes(selectedTask.id));
                        return successors.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">⬇️ Successeurs</h4>
                              <div className="space-y-1">
                                {successors.map(succ => (
                                    <div
                                        key={succ.id}
                                        className="flex items-center justify-between bg-blue-50 p-2 rounded text-sm cursor-pointer hover:bg-blue-100"
                                        onClick={() => setSelectedTaskId(succ.id)}
                                    >
                                      <span>{succ.name}</span>
                                      <span className="text-blue-600">({succ.id})</span>
                                    </div>
                                ))}
                              </div>
                            </div>
                        );
                      })()}

                      {selectedTask.isCritical && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <span className="text-red-600 text-lg">⚠️</span>
                              <div>
                                <p className="text-sm font-medium text-red-800">
                                  Tâche du chemin critique
                                </p>
                                <p className="text-xs text-red-600">
                                  Tout retard impactera la durée du projet
                                </p>
                              </div>
                            </div>
                          </div>
                      )}
                    </div>
                  </Card>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Styles CSS améliorés */}
        <style jsx>{`
          .dropdown {
            position: relative;
            display: inline-block;
          }

          .dropdown-content {
            display: none;
            position: absolute;
            right: 0;
            background-color: #ffffff;
            min-width: 200px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            z-index: 1000;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            margin-top: 0.25rem;
            overflow: hidden;
          }

          .dropdown:hover .dropdown-content {
            display: block;
          }

          .dropdown-content button:hover {
            background-color: #f3f4f6;
          }

          .dropdown-content button {
            transition: background-color 0.15s ease;
          }
        `}</style>
      </div>
  );
}