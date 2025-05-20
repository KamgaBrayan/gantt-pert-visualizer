'use client';

import React, { useState, useEffect } from 'react';
import { Task, DiagramType } from '@/lib/types';
import { generateId } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface TaskFormProps {
  initialTasks?: Task[];
  onSave: (tasks: Task[], diagramType: DiagramType) => void;
  onCancel?: () => void;
}

export default function TaskForm({
  initialTasks = [],
  onSave,
  onCancel
}: TaskFormProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks.length > 0 ? [...initialTasks] : [{
    id: generateId(),
    name: '',
    duration: 1,
    predecessors: []
  }]);
  
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramType.BOTH);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Réinitialiser les erreurs lors du changement de tâches
  useEffect(() => {
    setErrors({});
  }, [tasks]);
  
  // Ajouter une nouvelle tâche
  const addTask = () => {
    setTasks([...tasks, {
      id: generateId(),
      name: '',
      duration: 1,
      predecessors: []
    }]);
  };
  
  // Supprimer une tâche
  const removeTask = (index: number) => {
    const updatedTasks = [...tasks];
    const removedTaskId = updatedTasks[index].id;
    
    // Supprimer cette tâche
    updatedTasks.splice(index, 1);
    
    // Supprimer les références à cette tâche dans les prédécesseurs
    updatedTasks.forEach(task => {
      task.predecessors = task.predecessors.filter(pred => pred !== removedTaskId);
    });
    
    setTasks(updatedTasks);
  };
  
  // Mettre à jour une tâche
  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTasks(updatedTasks);
  };
  
  // Gérer les prédécesseurs
  const handlePredecessorChange = (taskIndex: number, predecessorId: string, isChecked: boolean) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    
    if (isChecked) {
      // Ajouter le prédécesseur s'il n'existe pas déjà
      if (!task.predecessors.includes(predecessorId)) {
        task.predecessors = [...task.predecessors, predecessorId];
      }
    } else {
      // Supprimer le prédécesseur
      task.predecessors = task.predecessors.filter(id => id !== predecessorId);
    }
    
    setTasks(updatedTasks);
  };
  
  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Vérifier que chaque tâche a un nom
    tasks.forEach((task, index) => {
      if (!task.name.trim()) {
        newErrors[`name-${index}`] = 'Le nom de la tâche est requis';
        isValid = false;
      }
      
      if (task.duration <= 0) {
        newErrors[`duration-${index}`] = 'La durée doit être positive';
        isValid = false;
      }
    });
    
    // Vérifier qu'il n'y a pas de cycle
    // (La détection de cycle est complexe, on la fait dans utils.ts)
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Soumettre le formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(tasks, diagramType);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Définir les tâches</h2>
        <Button 
          onClick={addTask} 
          type="button" 
          variant="outline"
          size="sm"
        >
          Ajouter une tâche
        </Button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto p-2">
        {tasks.map((task, index) => (
          <div key={task.id} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">Tâche {index + 1}</h3>
              {tasks.length > 1 && (
                <Button 
                  onClick={() => removeTask(index)} 
                  type="button" 
                  variant="danger"
                  size="sm"
                >
                  Supprimer
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la tâche
                </label>
                <input
                  type="text"
                  value={task.name}
                  onChange={(e) => updateTask(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Analyse des besoins"
                />
                {errors[`name-${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`name-${index}`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={task.duration}
                  onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors[`duration-${index}`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`duration-${index}`]}</p>
                )}
              </div>
            </div>
            
            {tasks.length > 1 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tâches précédentes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tasks.map((predTask, predIndex) => {
                    // Ne pas afficher la tâche actuelle comme prédécesseur possible
                    if (predIndex === index) return null;
                    
                    return (
                      <div key={predTask.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`pred-${index}-${predTask.id}`}
                          checked={task.predecessors.includes(predTask.id)}
                          onChange={(e) => handlePredecessorChange(index, predTask.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`pred-${index}-${predTask.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {predTask.name || `Tâche ${predIndex + 1}`}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de diagramme à générer
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600"
                value={DiagramType.GANTT}
                checked={diagramType === DiagramType.GANTT}
                onChange={() => setDiagramType(DiagramType.GANTT)}
              />
              <span className="ml-2">Diagramme de GANTT</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600"
                value={DiagramType.PERT}
                checked={diagramType === DiagramType.PERT}
                onChange={() => setDiagramType(DiagramType.PERT)}
              />
              <span className="ml-2">Diagramme de PERT</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-blue-600"
                value={DiagramType.BOTH}
                checked={diagramType === DiagramType.BOTH}
                onChange={() => setDiagramType(DiagramType.BOTH)}
              />
              <span className="ml-2">Les deux diagrammes</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button onClick={onCancel} type="button" variant="outline">
              Annuler
            </Button>
          )}
          <Button type="submit" variant="primary">
            Générer le diagramme
          </Button>
        </div>
      </div>
    </form>
  );
}