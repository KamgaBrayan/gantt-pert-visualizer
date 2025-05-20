'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface ProjectInfoProps {
  tasks: Task[];
  criticalPath?: string[];
  projectDuration?: number;
}

export default function ProjectInfo({
  tasks,
  criticalPath = [],
  projectDuration = 0
}: ProjectInfoProps) {
  // Trouver les tâches du chemin critique
  const criticalTasks = tasks.filter(task => criticalPath.includes(task.id));
  
  // Calculer le nombre de tâches
  const totalTasks = tasks.length;
  
  // Calculer la durée moyenne des tâches
  const averageDuration = totalTasks > 0
    ? Math.round(tasks.reduce((sum, task) => sum + task.duration, 0) / totalTasks * 10) / 10
    : 0;
  
  // Trouver la tâche avec la plus longue durée
  const longestTask = tasks.reduce((longest, task) => 
    task.duration > longest.duration ? task : longest, 
    { id: '', name: '', duration: 0, predecessors: [] }
  );
  
  // Trouver la tâche avec le plus de prédécesseurs
  const taskWithMostPredecessors = tasks.reduce((most, task) => 
    task.predecessors.length > most.predecessors.length ? task : most, 
    { id: '', name: '', duration: 0, predecessors: [] }
  );
  
  return (
    <Card title="Informations sur le projet" className="h-full">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Durée totale</h4>
            <p className="text-2xl font-bold text-blue-600">{formatDuration(projectDuration)}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-green-800">Nombre de tâches</h4>
            <p className="text-2xl font-bold text-green-600">{totalTasks}</p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Chemin critique</h3>
          <div className="bg-red-50 p-3 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-red-800">Durée du chemin critique</h4>
              <p className="text-lg font-bold text-red-600">{formatDuration(projectDuration)}</p>
            </div>
          </div>
          
          <h4 className="text-sm font-medium mb-1">Tâches sur le chemin critique:</h4>
          {criticalTasks.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {criticalTasks.map(task => (
                <li key={task.id} className="text-sm">
                  <span className="font-medium">{task.name}</span> - {formatDuration(task.duration)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm italic">Aucune tâche critique définie</p>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Statistiques</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Durée moyenne des tâches:</span>
              <span className="text-sm font-medium">{averageDuration} jours</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tâche la plus longue:</span>
              <span className="text-sm font-medium">
                {longestTask.name ? `${longestTask.name} (${formatDuration(longestTask.duration)})` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tâche avec le plus de dépendances:</span>
              <span className="text-sm font-medium">
                {taskWithMostPredecessors.name && taskWithMostPredecessors.predecessors.length > 0
                  ? `${taskWithMostPredecessors.name} (${taskWithMostPredecessors.predecessors.length})`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}