'use client';

import React, { useState, useEffect } from 'react';

// Types simulés pour la démo
interface Task {
  id: string;
  name: string;
  duration: number;
  predecessors: string[];
}

enum DiagramType {
  GANTT = 'gantt',
  PERT = 'pert',
  BOTH = 'both'
}

// Utilitaire pour générer des IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Composant Button modernisé
const Button = ({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  size = "md",
  className = "",
  ...props 
}) => {
  const baseClasses = "font-medium rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#6d38e0] to-[#198eb4] text-white hover:from-[#5d28d0] hover:to-[#1878a4] shadow-purple-500/25",
    outline: "border-2 border-[#6d38e0] text-[#6d38e0] hover:bg-[#6d38e0] hover:text-white bg-white/80 backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-red-500/25",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-[#040642] hover:bg-white/20"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  useEffect(() => {
    setErrors({});
  }, [tasks]);
  
  const addTask = () => {
    setTasks([...tasks, {
      id: generateId(),
      name: '',
      duration: 1,
      predecessors: []
    }]);
  };
  
  const removeTask = (index: number) => {
    const updatedTasks = [...tasks];
    const removedTaskId = updatedTasks[index].id;
    
    updatedTasks.splice(index, 1);
    
    updatedTasks.forEach(task => {
      task.predecessors = task.predecessors.filter(pred => pred !== removedTaskId);
    });
    
    setTasks(updatedTasks);
  };
  
  const updateTask = (index: number, field: keyof Task, value: any) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setTasks(updatedTasks);
  };
  
  const handlePredecessorChange = (taskIndex: number, predecessorId: string, isChecked: boolean) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    
    if (isChecked) {
      if (!task.predecessors.includes(predecessorId)) {
        task.predecessors = [...task.predecessors, predecessorId];
      }
    } else {
      task.predecessors = task.predecessors.filter(id => id !== predecessorId);
    }
    
    setTasks(updatedTasks);
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
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
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      onSave(tasks, diagramType);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040642] via-[#0a0a5a] to-[#1a1a6a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header avec animation d'entrée */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg opacity-90"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Gestionnaire de Projets
          </h1>
          <p className="text-xl text-blue-200/80 max-w-2xl mx-auto">
            Créez et visualisez vos tâches avec des diagrammes de Gantt et PERT professionnels
          </p>
        </div>

        {/* Formulaire principal */}
        <div className="space-y-8">
          {/* Section des tâches */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Définition des Tâches</h2>
                <p className="text-blue-200/70">Ajoutez et configurez les tâches de votre projet</p>
              </div>
              <Button 
                onClick={addTask} 
                type="button" 
                variant="glass"
                className="group"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
                  <span>Nouvelle Tâche</span>
                </span>
              </Button>
            </div>
            
            <div className="space-y-6 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-[#6d38e0]/50 pr-2">
              {tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="group bg-white/8 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/12 transition-all duration-500 hover:border-[#6d38e0]/30 hover:shadow-xl hover:shadow-purple-500/10"
                  style={{
                    animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#6d38e0] to-[#198eb4] rounded-xl flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-white">Tâche {index + 1}</h3>
                    </div>
                    {tasks.length > 1 && (
                      <Button 
                        onClick={() => removeTask(index)} 
                        type="button" 
                        variant="danger"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        Supprimer
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Nom de la tâche
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => updateTask(index, 'name', e.target.value)}
                          onFocus={() => setFocusedInput(`name-${index}`)}
                          onBlur={() => setFocusedInput(null)}
                          className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none transition-all duration-300 text-white placeholder-blue-200/50 ${
                            focusedInput === `name-${index}` 
                              ? 'border-[#6d38e0] shadow-lg shadow-purple-500/25 bg-white/15' 
                              : 'border-white/20 hover:border-white/30'
                          }`}
                          placeholder="Ex: Analyse des besoins"
                        />
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-[#6d38e0]/20 to-[#198eb4]/20 opacity-0 transition-opacity duration-300 pointer-events-none ${
                          focusedInput === `name-${index}` ? 'opacity-100' : ''
                        }`}></div>
                      </div>
                      {errors[`name-${index}`] && (
                        <p className="text-red-400 text-sm flex items-center space-x-2 animate-shake">
                          <span>⚠</span>
                          <span>{errors[`name-${index}`]}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Durée (jours)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={task.duration}
                          onChange={(e) => updateTask(index, 'duration', parseInt(e.target.value, 10) || 1)}
                          onFocus={() => setFocusedInput(`duration-${index}`)}
                          onBlur={() => setFocusedInput(null)}
                          className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:outline-none transition-all duration-300 text-white placeholder-blue-200/50 ${
                            focusedInput === `duration-${index}` 
                              ? 'border-[#6d38e0] shadow-lg shadow-purple-500/25 bg-white/15' 
                              : 'border-white/20 hover:border-white/30'
                          }`}
                        />
                      </div>
                      {errors[`duration-${index}`] && (
                        <p className="text-red-400 text-sm flex items-center space-x-2 animate-shake">
                          <span>⚠</span>
                          <span>{errors[`duration-${index}`]}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {tasks.length > 1 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <label className="block text-sm font-medium text-blue-200 mb-4">
                        Tâches précédentes
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tasks.map((predTask, predIndex) => {
                          if (predIndex === index) return null;
                          
                          return (
                            <label
                              key={predTask.id}
                              className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#6d38e0]/30 transition-all duration-300 cursor-pointer group"
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={task.predecessors.includes(predTask.id)}
                                  onChange={(e) => handlePredecessorChange(index, predTask.id, e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                                  task.predecessors.includes(predTask.id)
                                    ? 'bg-gradient-to-r from-[#6d38e0] to-[#198eb4] border-transparent'
                                    : 'border-white/30 group-hover:border-[#6d38e0]/50'
                                }`}>
                                  {task.predecessors.includes(predTask.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-white group-hover:text-blue-200 transition-colors duration-300">
                                {predTask.name || `Tâche ${predIndex + 1}`}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Section type de diagramme */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Type de Diagramme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: DiagramType.GANTT, label: 'Diagramme de Gantt', desc: 'Visualisation temporelle des tâches' },
                { value: DiagramType.PERT, label: 'Diagramme de PERT', desc: 'Réseau des dépendances' },
                { value: DiagramType.BOTH, label: 'Les Deux', desc: 'Analyse complète du projet' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${
                    diagramType === option.value
                      ? 'border-[#6d38e0] bg-gradient-to-br from-[#6d38e0]/20 to-[#198eb4]/20 shadow-lg shadow-purple-500/25'
                      : 'border-white/20 bg-white/5 hover:border-[#6d38e0]/50 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={option.value}
                    checked={diagramType === option.value}
                    onChange={() => setDiagramType(option.value)}
                  />
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">{option.label}</h4>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      diagramType === option.value
                        ? 'border-[#6d38e0] bg-[#6d38e0]'
                        : 'border-white/30 group-hover:border-[#6d38e0]/50'
                    }`}>
                      {diagramType === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-200/70 text-sm">{option.desc}</p>
                </label>
              ))}
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button onClick={onCancel} type="button" variant="outline" size="lg">
                Annuler
              </Button>
            )}
            <Button onClick={handleSubmit} variant="primary" size="lg" className="relative overflow-hidden group">
              <span className="relative z-10">Générer les Diagrammes</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#198eb4] to-[#6d38e0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-track-white\/10::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .scrollbar-thumb-purple-500\/50::-webkit-scrollbar-thumb {
          background: rgba(109, 56, 224, 0.5);
          border-radius: 3px;
        }
        
        .scrollbar-thumb-purple-500\/50::-webkit-scrollbar-thumb:hover {
          background: rgba(109, 56, 224, 0.7);
        }
      `}</style>
    </div>
  );
}