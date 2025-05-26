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
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const { tasks, criticalPath = [], projectDuration = 0, pertDiagram } = diagramData;
  
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
      fileName = 'project-tasks.json';
      mimeType = 'application/json';
    } else {
      content = exportToCSV(tasks);
      fileName = 'project-tasks.csv';
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
    setShowExportMenu(false);
  };
  
  // Générer les onglets pour les diagrammes
  const generateDiagramTabs = () => {
    const tabItems = [];
    
    if (diagramType === DiagramType.GANTT || diagramType === DiagramType.BOTH) {
      tabItems.push({
        id: 'gantt',
        label: 'Diagramme de Gantt',
        icon: (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        content: (
          <div className="animate-fadeIn">
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
        icon: (
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        content: (
          <div className="animate-fadeIn">
            <PertChart 
              tasks={tasks} 
              criticalPath={criticalPath}
              pertDiagram={pertDiagram}
              height={700}
              onTaskClick={handleTaskClick}
            />
          </div>
        )
      });
    }
    
    return tabItems;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/20 shadow-xl p-6 animate-slideDown">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#040642] to-[#6d38e0] bg-clip-text text-transparent">
                  Visualisation du Projet
                </h1>
                <p className="text-gray-600 mt-1">Analyse et suivi de vos tâches</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="group relative px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-[#6d38e0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-700 group-hover:text-[#6d38e0] transition-colors">Exporter</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-slideDown">
                    <div className="py-2">
                      <button 
                        onClick={() => handleExport('json')} 
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">JS</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Format JSON</div>
                          <div className="text-xs text-gray-500">Structure complète</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => handleExport('csv')} 
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors duration-200"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-[#198eb4] to-[#6d38e0] rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">CSV</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Format CSV</div>
                          <div className="text-xs text-gray-500">Tableau de données</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => onEditTasks(tasks)}
                className="group px-6 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-2"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-[#198eb4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-[#198eb4] transition-colors">Modifier</span>
              </button>
              
              <button
                onClick={onNewDiagram}
                className="group relative px-6 py-3 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#040642] to-[#6d38e0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium relative z-10">Nouveau projet</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Diagram Section */}
          <div className="xl:col-span-3">
            <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/20 shadow-xl overflow-hidden animate-slideUp">
              <Tabs tabs={generateDiagramTabs()} />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6 animate-slideLeft">
            <ProjectInfo 
              tasks={tasks} 
              criticalPath={criticalPath}
              projectDuration={projectDuration}
            />
            
            {selectedTask && (
              <div className="backdrop-blur-sm bg-white/70 rounded-2xl border border-white/20 shadow-xl p-6 animate-fadeIn">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#040642]">Détails de la tâche</h3>
                    <p className="text-sm text-gray-600">{selectedTask.name}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">Durée</div>
                      <div className="text-2xl font-bold text-[#6d38e0]">{formatDuration(selectedTask.duration)}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">Période</div>
                      <div className="text-sm font-bold text-[#198eb4]">J{selectedTask.start} - J{selectedTask.end}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">Début au plus tôt</div>
                      <div className="text-lg font-bold text-purple-600">J{selectedTask.earliestStart || selectedTask.start}</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                      <div className="text-sm font-medium text-gray-600 mb-1">Marge</div>
                      <div className="text-lg font-bold text-green-600">{selectedTask.slack || 0}j</div>
                    </div>
                  </div>
                  
                  {selectedTask.predecessors.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Prédécesseurs
                      </h4>
                      <div className="space-y-2">
                        {selectedTask.predecessors.map(predId => {
                          const pred = tasks.find(t => t.id === predId);
                          return (
                            <div key={predId} className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                              <div className="w-2 h-2 bg-[#6d38e0] rounded-full"></div>
                              <span className="text-sm text-gray-700">{pred ? pred.name : predId}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {criticalPath.includes(selectedTask.id) && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-4 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-800">Tâche critique</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">Cette tâche impacte directement la durée du projet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)}
        ></div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        
        .animate-slideLeft {
          animation: slideLeft 0.6s ease-out;
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
