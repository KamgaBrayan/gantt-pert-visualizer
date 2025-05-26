'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

interface ProjectInfoProps {
  tasks: Task[];
  criticalPath?: string[];
  projectDuration?: number;
}

interface AnimatedStatProps {
  value: number;
  duration?: number;
}

function AnimatedCounter({ value, duration = 1000 }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Utiliser une fonction d'easing pour une animation plus fluide
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOutCubic * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export default function ProjectInfo({
  tasks,
  criticalPath = [],
  projectDuration = 0
}: ProjectInfoProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculer les statistiques correctes
  const totalTasks = tasks.length;
  
  // Trouver les tâches du chemin critique
  const criticalTasks = tasks.filter(task => criticalPath.includes(task.id));
  const criticalTasksCount = criticalTasks.length;
  
  // Calculer le pourcentage de tâches critiques (correct)
  const criticalPercentage = totalTasks > 0 ? Math.round((criticalTasksCount / totalTasks) * 100) : 0;
  
  // Calculer la durée moyenne des tâches
  const averageDuration = totalTasks > 0
    ? Math.round(tasks.reduce((sum, task) => sum + task.duration, 0) / totalTasks * 10) / 10
    : 0;
  
  // Trouver la tâche avec la plus longue durée
  const longestTask = tasks.reduce((longest, task) => 
    task.duration > longest.duration ? task : longest, 
    { id: '', name: 'Aucune', duration: 0, predecessors: [] }
  );
  
  // Trouver la tâche avec le plus de prédécesseurs
  const taskWithMostPredecessors = tasks.reduce((most, task) => 
    task.predecessors.length > most.predecessors.length ? task : most, 
    { id: '', name: 'Aucune', duration: 0, predecessors: [] }
  );

  // Calculer la durée totale des tâches critiques
  const criticalPathDuration = criticalTasks.reduce((sum, task) => sum + task.duration, 0);
  
  // Calculer l'efficacité du projet (ratio tâches critiques / total)
  const projectEfficiency = totalTasks > 0 ? Math.round((1 - (criticalTasksCount / totalTasks)) * 100) : 0;
  
  // Calculer la marge moyenne des tâches non critiques
  const nonCriticalTasks = tasks.filter(task => !criticalPath.includes(task.id));
  const averageSlack = nonCriticalTasks.length > 0
    ? Math.round(nonCriticalTasks.reduce((sum, task) => sum + (task.slack || 0), 0) / nonCriticalTasks.length * 10) / 10
    : 0;

  return (
    <div className={`h-full transition-all duration-1000 ease-out ${
      isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
    }`}>
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-6 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px),
                             radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                             radial-gradient(circle at 40% 40%, white 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Aperçu du Projet</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm opacity-90">Analyse terminée</span>
            </div>
          </div>
          <p className="text-sm opacity-80">Métriques et statistiques détaillées</p>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100">
        {/* Statistiques principales */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Durée totale */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 transition-all duration-300 hover:shadow-md hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">Durée Totale</h4>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  <AnimatedCounter value={projectDuration} />
                  <span className="text-sm font-medium ml-1">jours</span>
                </p>
                <div className="w-full bg-blue-200/50 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: isVisible ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Nombre de tâches */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 transition-all duration-300 hover:shadow-md hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-emerald-800">Total Tâches</h4>
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600 mb-1">
                  <AnimatedCounter value={totalTasks} />
                  <span className="text-sm font-medium ml-1">tâches</span>
                </p>
                <div className="w-full bg-emerald-200/50 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: isVisible ? '85%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chemin critique */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Chemin Critique</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">{criticalPercentage}% du projet</span>
              </div>
            </div>
            
            {/* Statistiques du chemin critique */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Nombre de tâches critiques */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 p-4 group hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800">Tâches Critiques</h4>
                      <p className="text-sm text-red-600">Sans marge</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      <AnimatedCounter value={criticalTasksCount} />
                    </p>
                    <p className="text-xs text-red-500">{criticalPercentage}%</p>
                  </div>
                </div>
              </div>
              
              {/* Durée du chemin critique */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 via-yellow-50 to-amber-50 p-4 group hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800">Durée Critique</h4>
                      <p className="text-sm text-orange-600">Chemin principal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      <AnimatedCounter value={projectDuration} />
                    </p>
                    <p className="text-xs text-orange-500">jours</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tâches critiques */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tâches sur le chemin critique</h4>
              {criticalTasks.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {criticalTasks.map((task, index) => (
                    <div 
                      key={task.id} 
                      className={`group flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 hover:shadow-md transition-all duration-300 ${
                        isVisible ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <span className="font-medium text-gray-800 text-sm">{task.name}</span>
                          <p className="text-xs text-red-600">
                            {formatDuration(task.duration)} • Marge: {task.slack || 0}j
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Aucune tâche critique identifiée</p>
                  <p className="text-xs text-gray-400">Le chemin critique sera calculé automatiquement</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Statistiques Avancées</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Durée moyenne */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Durée Moyenne</span>
                    <p className="text-xs text-purple-600">Par tâche</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-600">
                    <AnimatedCounter value={Math.round(averageDuration * 10)} /> 
                  </span>
                  <span className="text-sm text-purple-500 ml-1">j</span>
                </div>
              </div>
              
              {/* Tâche la plus longue */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">Tâche la Plus Longue</span>
                    <p className="text-xs text-amber-600 truncate">
                      {longestTask.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-amber-600">
                    <AnimatedCounter value={longestTask.duration} />j
                  </span>
                </div>
              </div>
              
              {/* Marge moyenne */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">Marge Moyenne</span>
                    <p className="text-xs text-teal-600">Tâches non critiques</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-teal-600">
                    <AnimatedCounter value={Math.round(averageSlack * 10)} />
                  </span>
                  <span className="text-sm text-teal-500 ml-1">j</span>
                </div>
              </div>
              
              {/* Efficacité du projet */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Flexibilité</span>
                    <p className="text-xs text-green-600">Tâches avec marge</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">
                    <AnimatedCounter value={100 - criticalPercentage} />%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
