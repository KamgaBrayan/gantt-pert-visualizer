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
  
  // Calcul des dates au plus tôt (forward pass)
  calculateEarliestTimes(sortedTasks);
  
  // Calcul des dates au plus tard (backward pass)
  calculateLatestTimes(sortedTasks);
  
  // Calcul des marges et du chemin critique
  calculateSlackAndCriticalPath(sortedTasks);
  
  // Calcul de la durée totale du projet
  const projectDuration = calculateProjectDuration(sortedTasks);
  
  // Identifier le chemin critique
  const criticalPath = sortedTasks
    .filter(task => task.isCritical)
    .map(task => task.id);
  
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
  
  // Identifier toutes les tâches sans prédécesseurs d'abord
  const rootTasks = tasks.filter(task => task.predecessors.length === 0);
  
  // Si aucune tâche sans prédécesseurs, on commence par n'importe quelle tâche
  if (rootTasks.length === 0 && tasks.length > 0) {
    dfs(tasks[0].id);
  } else {
    // Sinon, on commence par toutes les tâches sans prédécesseurs
    rootTasks.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    });
  }
  
  // Ajouter les tâches restantes (pour gérer les composants connectés séparés)
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      dfs(task.id);
    }
  });
  
  return result;
}

/**
 * Calcule les dates au plus tôt (early start/finish) - Forward Pass
 * @param tasks Liste des tâches triées topologiquement
 */
function calculateEarliestTimes(tasks: Task[]): void {
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Pour chaque tâche dans l'ordre topologique (avant vers après)
  tasks.forEach(task => {
    // Si pas de prédécesseurs, commence à 0
    if (task.predecessors.length === 0) {
      task.earliestStart = 0;
      task.start = 0;
    } else {
      // Sinon, commence après la fin au plus tôt de tous les prédécesseurs
      task.earliestStart = Math.max(
        ...task.predecessors.map(predId => {
          const pred = taskMap.get(predId);
          return pred ? (pred.earliestFinish || 0) : 0;
        })
      );
      task.start = task.earliestStart;
    }
    
    // Calcule la date de fin au plus tôt
    task.earliestFinish = (task.earliestStart || 0) + task.duration;
    task.end = task.earliestFinish;
  });
}

/**
 * Calcule les dates au plus tard (late start/finish) - Backward Pass
 * @param tasks Liste des tâches triées topologiquement
 */
function calculateLatestTimes(tasks: Task[]): void {
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
  
  // Trouver la date de fin du projet (la plus grande date de fin au plus tôt)
  const projectEnd = Math.max(...tasks.map(t => t.earliestFinish || 0));
  
  // Pour chaque tâche dans l'ordre topologique inverse (après vers avant)
  [...tasks].reverse().forEach(task => {
    const successors = successorsMap.get(task.id) || [];
    
    // Si pas de successeurs, finit à la fin du projet
    if (successors.length === 0) {
      task.latestFinish = projectEnd;
    } else {
      // Sinon, finit avant le début au plus tard de tous les successeurs
      task.latestFinish = Math.min(
        ...successors.map(succId => {
          const succ = taskMap.get(succId);
          return succ ? (succ.latestStart || projectEnd) : projectEnd;
        })
      );
    }
    
    // Calcule la date de début au plus tard
    task.latestStart = (task.latestFinish || 0) - task.duration;
  });
}

/**
 * Calcule les marges et identifie le chemin critique
 * Formule pour la marge totale: LS - ES ou LF - EF
 * @param tasks Liste des tâches
 */
function calculateSlackAndCriticalPath(tasks: Task[]): void {
  tasks.forEach(task => {
    // Calcul de la marge totale (LS - ES ou LF - EF, les deux sont équivalents)
    task.slack = (task.latestStart || 0) - (task.earliestStart || 0);
    
    // Une tâche est critique si sa marge est nulle (ou très proche de zéro)
    task.isCritical = Math.abs(task.slack) < 0.001; // Tolérance pour les erreurs de précision
    
    // S'assurer que les dates de début et fin sont définies
    if (task.start === undefined) task.start = task.earliestStart;
    if (task.end === undefined) task.end = task.earliestFinish;
  });
}

/**
 * Calcule la durée totale du projet
 * @param tasks Liste des tâches avec dates calculées
 * @returns Durée totale du projet
 */
function calculateProjectDuration(tasks: Task[]): number {
  return Math.max(...tasks.map(t => t.earliestFinish || t.end || 0));
}
