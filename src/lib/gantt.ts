import { Task, DiagramData } from './types';

/**
 * Calcule les dates de début et de fin pour chaque tâche dans un diagramme de GANTT
 * @param tasks Liste des tâches
 * @returns Données calculées pour le diagramme de GANTT
 */
export function calculateGanttData(tasks: Task[]): DiagramData {
  // Copie profonde des tâches pour ne pas modifier les originales
  const workingTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  
  // Trie topologique pour respecter les dépendances
  const sortedTasks = topologicalSort(workingTasks);
  
  // Calcul des dates de début et de fin
  calculateStartAndEndDates(sortedTasks);
  
  // Calcul du chemin critique
  const criticalPath = calculateCriticalPath(sortedTasks);
  
  // Marquer les tâches critiques
  markCriticalTasks(sortedTasks, criticalPath);
  
  // Calcul de la durée totale du projet
  const projectDuration = calculateProjectDuration(sortedTasks);
  
  // Attribution de couleurs aux tâches
  assignColors(sortedTasks);
  
  return {
    tasks: sortedTasks,
    criticalPath,
    projectDuration
  };
}

/**
 * Trie topologiquement les tâches en fonction de leurs dépendances
 * @param tasks Liste des tâches
 * @returns Liste des tâches triées
 */
function topologicalSort(tasks: Task[]): Task[] {
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Ensemble pour suivre les tâches visitées
  const visited = new Set<string>();
  // Ensemble pour détecter les cycles
  const temp = new Set<string>();
  // Résultat final
  const result: Task[] = [];
  
  // Fonction DFS récursive
  function dfs(taskId: string): void {
    // Si déjà dans le résultat, on ignore
    if (visited.has(taskId)) return;
    // Si déjà en cours de visite, on a un cycle
    if (temp.has(taskId)) {
      console.error(`Cycle détecté dans les dépendances des tâches: ${taskId}`);
      return;
    }
    
    // Marquer comme en cours de visite
    temp.add(taskId);
    
    // Visiter tous les prédécesseurs
    const task = taskMap.get(taskId);
    if (task) {
      task.predecessors.forEach(predId => {
        if (taskMap.has(predId)) {
          dfs(predId);
        }
      });
    }
    
    // Marquer comme visité et ajouter au résultat
    temp.delete(taskId);
    visited.add(taskId);
    if (task) {
      result.unshift(task); // Ajouter au début pour avoir l'ordre topologique inverse
    }
  }
  
  // Appliquer DFS à toutes les tâches
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  });
  
  return result;
}

/**
 * Calcule les dates de début et de fin pour chaque tâche
 * @param tasks Liste des tâches triées topologiquement
 */
function calculateStartAndEndDates(tasks: Task[]): void {
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Pour chaque tâche dans l'ordre topologique
  tasks.forEach(task => {
    // Si pas de prédécesseurs, commence à 0
    if (task.predecessors.length === 0) {
      task.start = 0;
    } else {
      // Sinon, commence après la fin de tous les prédécesseurs
      task.start = Math.max(
        ...task.predecessors.map(predId => {
          const pred = taskMap.get(predId);
          return pred ? (pred.end || 0) : 0;
        })
      );
    }
    
    // Calcule la date de fin
    task.end = (task.start || 0) + task.duration;
  });
}

/**
 * Calcule le chemin critique du projet
 * @param tasks Liste des tâches avec dates calculées
 * @returns Liste des IDs des tâches du chemin critique
 */
function calculateCriticalPath(tasks: Task[]): string[] {
  // Trouver la tâche qui finit en dernier
  const lastEndTime = Math.max(...tasks.map(t => t.end || 0));
  const endTasks = tasks.filter(t => t.end === lastEndTime);
  
  // Chemin critique (en arrière)
  const criticalPath: string[] = [];
  const visited = new Set<string>();
  
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Map inverse pour trouver les successeurs
  const successorsMap = new Map<string, string[]>();
  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      if (!successorsMap.has(predId)) {
        successorsMap.set(predId, []);
      }
      successorsMap.get(predId)?.push(task.id);
    });
  });
  
  // Fonction récursive pour construire le chemin critique en arrière
  function buildCriticalPath(taskId: string): void {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    criticalPath.push(taskId);
    
    const task = taskMap.get(taskId);
    if (!task) return;
    
    // Trouver le prédécesseur critique
    const criticalPred = task.predecessors
      .map(predId => taskMap.get(predId))
      .filter(Boolean)
      .find(pred => (pred?.end || 0) === (task.start || 0));
    
    if (criticalPred) {
      buildCriticalPath(criticalPred.id);
    }
  }
  
  // Commencer par les tâches de fin
  endTasks.forEach(task => buildCriticalPath(task.id));
  
  return criticalPath.reverse(); // Inverser pour avoir l'ordre chronologique
}

/**
 * Marque les tâches qui font partie du chemin critique
 * @param tasks Liste des tâches
 * @param criticalPath Liste des IDs des tâches du chemin critique
 */
function markCriticalTasks(tasks: Task[], criticalPath: string[]): void {
  const criticalSet = new Set(criticalPath);
  tasks.forEach(task => {
    task.isCritical = criticalSet.has(task.id);
  });
}

/**
 * Calcule la durée totale du projet
 * @param tasks Liste des tâches
 * @returns Durée totale du projet
 */
function calculateProjectDuration(tasks: Task[]): number {
  return Math.max(...tasks.map(t => t.end || 0));
}

/**
 * Attribue des couleurs aux tâches
 * @param tasks Liste des tâches
 */
function assignColors(tasks: Task[]): void {
  // Palette de couleurs
  const colors = [
    '#4285F4', // Bleu Google
    '#34A853', // Vert Google
    '#FBBC05', // Jaune Google
    '#EA4335', // Rouge Google
    '#8E24AA', // Violet
    '#00ACC1', // Cyan
    '#FB8C00', // Orange
    '#546E7A'  // Gris bleuté
  ];
  
  // Grouper les tâches par leurs prédécesseurs
  const groups = new Map<string, Task[]>();
  
  tasks.forEach(task => {
    const key = task.predecessors.sort().join(',') || 'root';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(task);
  });
  
  // Attribuer des couleurs par groupe
  let colorIndex = 0;
  groups.forEach(groupTasks => {
    const color = colors[colorIndex % colors.length];
    groupTasks.forEach(task => {
      // Les tâches critiques restent rouges
      task.color = task.isCritical ? '#EA4335' : color;
    });
    colorIndex++;
  });
}