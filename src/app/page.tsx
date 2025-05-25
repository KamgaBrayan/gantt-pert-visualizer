'use client';

import React, { useState } from 'react';
import { Task, DiagramType, DiagramData } from '@/lib/types';
import { calculateGanttData } from '@/lib/gantt';
import { calculatePertData } from '@/lib/pert';
import { generateSampleData, validateTasks } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TaskForm from '@/components/forms/TaskForm';
import ImportForm from '@/components/forms/ImportForm';
import DiagramResult from '@/components/diagrams/DiagramResult';

enum AppState {
  INITIAL = 'initial',
  IMPORT = 'import',
  FORM = 'form',
  RESULT = 'result'
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>(AppState.INITIAL);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramType.BOTH);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Générer des diagrammes à partir des tâches
  const generateDiagrams = (tasks: Task[], type: DiagramType) => {
    try {
      const validation = validateTasks(tasks);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        return;
      }

      let data: DiagramData;

      switch (type) {
        case DiagramType.GANTT:
          data = calculateGanttData(tasks);
          break;
        case DiagramType.PERT:
          data = calculatePertData(tasks);
          break;
        case DiagramType.BOTH:
        default:
          const ganttData = calculateGanttData(tasks);
          const pertData = calculatePertData(tasks);
          data = pertData;
          break;
      }

      setDiagramData(data);
      setDiagramType(type);
      transitionToState(AppState.RESULT);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la génération des diagrammes:', err);
      setError(`Erreur lors de la génération des diagrammes: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // Animation de transition entre les états
  const transitionToState = (newState: AppState) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setAppState(newState);
      setIsTransitioning(false);
    }, 300);
  };

  const handleSaveForm = (newTasks: Task[], type: DiagramType) => {
    setTasks([...newTasks]);
    generateDiagrams(newTasks, type);
  };

  const handleImport = (importedTasks: Task[]) => {
    setTasks([...importedTasks]);
    transitionToState(AppState.FORM);
  };

  const handleEditTasks = (tasksToEdit: Task[]) => {
    setTasks([...tasksToEdit]);
    transitionToState(AppState.FORM);
  };

  const useSampleData = () => {
    const sampleData = generateSampleData();
    setTasks(sampleData);
    transitionToState(AppState.FORM);
  };

  const handleNewDiagram = () => {
    setTasks([]);
    setDiagramData(null);
    transitionToState(AppState.INITIAL);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.INITIAL:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              {/* Hero Section */}
              <div className="text-center mb-16 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-3xl mb-8 shadow-2xl animate-float">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-[#040642] via-[#6d38e0] to-[#198eb4] bg-clip-text text-transparent mb-6">
                  TaskFlow Studio
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Créez et visualisez vos diagrammes de planification de projet avec une interface moderne et intuitive
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#6d38e0] rounded-full"></div>
                    <span>Diagrammes GANTT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#198eb4] rounded-full"></div>
                    <span>Diagrammes PERT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#040642] rounded-full"></div>
                    <span>Chemin critique</span>
                  </div>
                </div>
              </div>

              {/* Cards Section */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div 
                  className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/20"
                  onClick={() => transitionToState(AppState.FORM)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="w-3 h-3 bg-[#6d38e0] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#040642] mb-3">Créer manuellement</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Définissez vos tâches étape par étape avec notre interface intuitive et créez des diagrammes personnalisés.
                  </p>
                  <div className="flex items-center text-[#6d38e0] font-medium group-hover:translate-x-2 transition-transform duration-300">
                    Commencer
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>

                <div 
                  className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/20"
                  onClick={() => transitionToState(AppState.IMPORT)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#198eb4] to-[#6d38e0] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <div className="w-3 h-3 bg-[#198eb4] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#040642] mb-3">Importer des données</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Importez vos tâches depuis un fichier CSV ou JSON pour une création rapide de vos diagrammes.
                  </p>
                  <div className="flex items-center text-[#198eb4] font-medium group-hover:translate-x-2 transition-transform duration-300">
                    Importer
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sample Data Button */}
              <div className="text-center">
                <button 
                  onClick={useSampleData}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#040642] to-[#6d38e0] text-white px-8 py-4 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Essayer avec des données d'exemple
                </button>
              </div>
            </div>
          </div>
        );
        
      case AppState.IMPORT:
        return (
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
              <div className="max-w-2xl mx-auto pt-8">
                <ImportForm 
                  onImport={handleImport} 
                  onCancel={() => transitionToState(AppState.INITIAL)} 
                />
              </div>
            </div>
          </div>
        );
        
      case AppState.FORM:
        return (
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
              <div className="max-w-6xl mx-auto pt-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
                  <TaskForm 
                    initialTasks={tasks}
                    onSave={handleSaveForm}
                    onCancel={() => transitionToState(AppState.INITIAL)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case AppState.RESULT:
        if (!diagramData) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
              <div className="text-center bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
                <p className="text-red-600 mb-4 text-lg">Erreur: données de diagramme non disponibles</p>
                <button 
                  onClick={() => transitionToState(AppState.INITIAL)}
                  className="bg-gradient-to-r from-[#6d38e0] to-[#198eb4] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Recommencer
                </button>
              </div>
            </div>
          );
        }
        
        return (
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
              <DiagramResult 
                diagramData={diagramData}
                diagramType={diagramType}
                onNewDiagram={handleNewDiagram}
                onEditTasks={handleEditTasks}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm animate-slide-in-right max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1">Erreur détectée</h3>
              <pre className="whitespace-pre-wrap text-sm opacity-90">{error}</pre>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {renderContent()}
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}