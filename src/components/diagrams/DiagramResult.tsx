'use client';

import React, { useState } from 'react';
import { Task, DiagramType, DiagramData } from '@/lib/types';
import { exportToJSON, exportToCSV } from '@/lib/utils';
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
  
  const { tasks, criticalPath = [], projectDuration = 0 } = diagramData;
  
  // Trouver la tâche sélectionnée
  const selectedTask = selectedTaskId 
    ? tasks.find(task => task.id === selectedTaskId) 
    : null;
  
  // Gérer le clic sur une tâche
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
  };
  
  // Exporter les données
  const handleExport = (format: 'json' | 'csv') => {
    let content = '';
    let fileName = '';
    let mimeType = '';
    
    if (format === 'json') {
      content = exportToJSON(tasks);
      fileName = 'tasks.json';
      mimeType = 'application/json';
    } else {
      content = exportToCSV(tasks);
      fileName = 'tasks.csv';
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
  };
  
  // Générer les onglets pour les diagrammes
  const generateDiagramTabs = () => {
    const tabItems = [];
    
    if (diagramType === DiagramType.GANTT || diagramType === DiagramType.BOTH) {
      tabItems.push({
        id: 'gantt',
        label: 'Diagramme de GANTT',
        content: (
          <div className="mt-4">
            <GanttChart 
              tasks={tasks} 
              criticalPath={criticalPath}
              height={500}
              onTaskClick={handleTaskClick}
            />
          </div>
        )
      });
    }
    
    if (diagramType === DiagramType.PERT || diagramType === DiagramType.BOTH) {
      tabItems.push({
        id: 'pert',
        label: 'Diagramme de PERT',
        content: (
          <div className="mt-4">
            <PertChart 
              tasks={tasks} 
              criticalPath={criticalPath}
              height={600}
              onTaskClick={handleTaskClick}
            />
          </div>
        )
      });
    }
    
    return tabItems;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Résultat</h2>
        <div className="flex space-x-3">
          <div className="dropdown">
            <Button variant="outline" size="sm">
              Exporter
            </Button>
            <div className="dropdown-content">
              <button 
                onClick={() => handleExport('json')} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Exporter en JSON
              </button>
              <button 
                onClick={() => handleExport('csv')} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Exporter en CSV
              </button>
            </div>
          </div>
          <Button onClick={() => onEditTasks(tasks)} variant="outline" size="sm">
            Modifier les tâches
          </Button>
          <Button onClick={onNewDiagram} variant="primary" size="sm">
            Nouveau diagramme
          </Button>
        </div>
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
            
            {selectedTask && (
              <Card title={`Détails de la tâche: ${selectedTask.name}`}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Durée</h4>
                    <p>{formatDuration(selectedTask.duration)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Début</h4>
                    <p>Jour {selectedTask.start}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Fin</h4>
                    <p>Jour {selectedTask.end}</p>
                  </div>
                  
                  {selectedTask.predecessors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Prédécesseurs</h4>
                      <ul className="list-disc pl-5">
                        {selectedTask.predecessors.map(predId => {
                          const pred = tasks.find(t => t.id === predId);
                          return (
                            <li key={predId}>
                              {pred ? pred.name : predId}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {selectedTask.isCritical && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-red-800">
                        Cette tâche fait partie du chemin critique
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      
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
          min-width: 180px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          z-index: 1;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          margin-top: 0.25rem;
        }
        
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>
  );
}

// Formater une durée
function formatDuration(duration: number): string {
  if (duration === 1) {
    return '1 jour';
  }
  return `${duration} jours`;
}