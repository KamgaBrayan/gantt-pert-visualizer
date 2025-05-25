// src/app/page.tsx - VERSION FINALE CORRIGÉE

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
  const [isGenerating, setIsGenerating] = useState(false);

  // Générer des diagrammes à partir des tâches
  const generateDiagrams = async (tasks: Task[], type: DiagramType) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Attendre un peu pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Valider les tâches
      const validation = validateTasks(tasks);
      if (!validation.valid) { // ✅ CORRECTION: valid au lieu de isValid
        setError(validation.errors.join('\n'));
        return;
      }

      // Calculer les données selon le type de diagramme
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
          // Si les deux diagrammes sont demandés, calculer PERT (plus complet)
          data = calculatePertData(tasks);

          // Validation croisée avec Gantt
          const ganttData = calculateGanttData(tasks);
          console.log('✅ Validation Gantt-PERT:', {
            pertDuration: data.projectDuration,
            ganttDuration: ganttData.projectDuration,
            coherent: data.projectDuration === ganttData.projectDuration
          });
          break;
      }

      // Mettre à jour l'état
      setDiagramData(data);
      setDiagramType(type);
      setAppState(AppState.RESULT);
      setError(null);

      console.log('🎯 Diagrammes générés:', {
        tasks: tasks.length,
        type,
        duration: data.projectDuration,
        critical: data.criticalPath?.length || 0
      });

    } catch (err) {
      console.error('❌ Erreur lors de la génération:', err);
      setError(`Erreur lors de la génération des diagrammes: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Gérer la sauvegarde des tâches depuis le formulaire
  const handleSaveForm = (newTasks: Task[], type: DiagramType) => {
    setTasks([...newTasks]);
    generateDiagrams(newTasks, type);
  };

  // Gérer l'import des tâches
  const handleImport = (importedTasks: Task[]) => {
    setTasks([...importedTasks]);
    setAppState(AppState.FORM);
  };

  // Gérer l'édition des tâches
  const handleEditTasks = (tasksToEdit: Task[]) => {
    setTasks([...tasksToEdit]);
    setAppState(AppState.FORM);
  };

  // Utiliser des données d'exemple
  const useSampleData = () => {
    const sampleData = generateSampleData();
    setTasks(sampleData);
    generateDiagrams(sampleData, DiagramType.BOTH); // ✅ Générer directement l'exemple
  };

  // Redémarrer avec un nouveau diagramme
  const handleNewDiagram = () => {
    setTasks([]);
    setDiagramData(null);
    setAppState(AppState.INITIAL);
    setError(null);
  };

  // Rendu en fonction de l'état de l'application
  const renderContent = () => {
    switch (appState) {
      case AppState.INITIAL:
        return (
            <Card className="max-w-2xl mx-auto">
              <div className="text-center space-y-6 py-4">
                <h2 className="text-2xl font-bold text-gray-800">Créer un nouveau diagramme</h2>
                <p className="text-gray-600">
                  Créez un diagramme de GANTT ou PERT à partir d'un ensemble de tâches.
                  Choisissez l'une des options ci-dessous pour commencer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                      onClick={() => setAppState(AppState.FORM)}
                      variant="primary"
                      fullWidth
                      icon="✏️"
                  >
                    Créer des tâches manuellement
                  </Button>
                  <Button
                      onClick={() => setAppState(AppState.IMPORT)}
                      variant="outline"
                      fullWidth
                      icon="📁"
                  >
                    Importer des tâches
                  </Button>
                </div>

                <div className="pt-3">
                  <Button
                      onClick={useSampleData}
                      variant="secondary"
                      fullWidth
                      icon="🎯"
                      disabled={isGenerating}
                  >
                    {isGenerating ? 'Génération...' : 'Voir un exemple complet'}
                  </Button>
                </div>

                {/* ✅ Informations techniques */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-xs text-gray-600">Calculs temps réel</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🎯</div>
                    <div className="text-xs text-gray-600">Chemin critique</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-xs text-gray-600">Export professionnel</div>
                  </div>
                </div>
              </div>
            </Card>
        );

      case AppState.IMPORT:
        return (
            <div className="max-w-2xl mx-auto">
              <ImportForm
                  onImport={handleImport}
                  onCancel={() => setAppState(AppState.INITIAL)}
              />
            </div>
        );

      case AppState.FORM:
        return (
            <div className="max-w-4xl mx-auto">
              <Card>
                <div className="relative">
                  <TaskForm
                      initialTasks={tasks}
                      onSave={handleSaveForm}
                      onCancel={() => setAppState(AppState.INITIAL)}
                  />

                  {/* ✅ Overlay de génération */}
                  {isGenerating && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Génération en cours...
                          </h3>
                          <p className="text-sm text-gray-600">
                            Calcul des chemins critiques et optimisation
                          </p>
                        </div>
                      </div>
                  )}
                </div>
              </Card>
            </div>
        );

      case AppState.RESULT:
        if (!diagramData) {
          return (
              <div className="text-center">
                <p className="text-red-600">Erreur: données de diagramme non disponibles</p>
                <Button
                    onClick={() => setAppState(AppState.INITIAL)}
                    variant="primary"
                    className="mt-4"
                >
                  Recommencer
                </Button>
              </div>
          );
        }

        return (
            <DiagramResult
                diagramData={diagramData}
                diagramType={diagramType}
                onNewDiagram={handleNewDiagram}
                onEditTasks={handleEditTasks}
            />
        );

      default:
        return null;
    }
  };

  return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Visualisateur de diagrammes GANTT & PERT
          </h1>
          <p className="text-gray-600">
            Créez et visualisez facilement vos diagrammes de planification de projet
          </p>

          {/* ✅ Indicateur d'état */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${appState === AppState.INITIAL ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <span>Configuration</span>
              <div className={`w-2 h-2 rounded-full ${appState === AppState.FORM ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <span>Saisie</span>
              <div className={`w-2 h-2 rounded-full ${appState === AppState.RESULT ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>Résultats</span>
            </div>
          </div>
        </div>

        {/* ✅ Message d'erreur amélioré */}
        {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <Card className="border-red-200 bg-red-50">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 text-xl">❌</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
                    <pre className="whitespace-pre-wrap text-sm text-red-700 bg-red-100 p-3 rounded">{error}</pre>
                    <Button
                        onClick={() => setError(null)}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
        )}

        {renderContent()}

        {/* ✅ Message de chargement global */}
        {isGenerating && appState === AppState.INITIAL && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="max-w-sm">
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-700">Génération de l'exemple...</p>
                </div>
              </Card>
            </div>
        )}
      </main>
  );
}