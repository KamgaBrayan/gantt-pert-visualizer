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

  // Générer des diagrammes à partir des tâches
  const generateDiagrams = (tasks: Task[], type: DiagramType) => {
    try {
      // Valider les tâches
      const validation = validateTasks(tasks);
      if (!validation.isValid) {
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
          // Si les deux diagrammes sont demandés, calculer les deux
          const ganttData = calculateGanttData(tasks);
          const pertData = calculatePertData(tasks);
          
          // Fusionner les données (PERT contient plus d'informations)
          data = pertData;
          break;
      }

      // Mettre à jour l'état
      setDiagramData(data);
      setDiagramType(type);
      setAppState(AppState.RESULT);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la génération des diagrammes:', err);
      setError(`Erreur lors de la génération des diagrammes: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
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
    setAppState(AppState.FORM);
  };

  // Redémarrer avec un nouveau diagramme
  const handleNewDiagram = () => {
    setTasks([]);
    setDiagramData(null);
    setAppState(AppState.INITIAL);
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
                >
                  Créer des tâches manuellement
                </Button>
                <Button 
                  onClick={() => setAppState(AppState.IMPORT)} 
                  variant="outline" 
                  fullWidth
                >
                  Importer des tâches
                </Button>
              </div>
              
              <div className="pt-3">
                <Button 
                  onClick={useSampleData} 
                  variant="secondary" 
                  fullWidth
                >
                  Utiliser des données d'exemple
                </Button>
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
              <TaskForm 
                initialTasks={tasks}
                onSave={handleSaveForm}
                onCancel={() => setAppState(AppState.INITIAL)}
              />
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
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Erreur</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      
      {renderContent()}
    </main>
  );
}