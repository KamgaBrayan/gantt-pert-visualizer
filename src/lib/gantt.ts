// src/lib/gantt.ts - VERSION ENTIÈREMENT CORRIGÉE

import { Task, DiagramData } from './types';
import { validateTasks } from './utils';

export function calculateGanttData(tasks: Task[]): DiagramData {
  // ✅ Validation des données d'entrée
  const validation = validateTasks(tasks);
  if (!validation.valid) {
    throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
  }

  const workingTasks = JSON.parse(JSON.stringify(tasks)) as Task[];

  // 1. Tri topologique CORRIGÉ
  const sortedTasks = topologicalSortCorrect(workingTasks);

  // 2. Calcul des dates de début et fin (Forward Pass)
  calculateStartAndEndDatesCorrect(sortedTasks);

  // 3. Calcul des dates au plus tard (Backward Pass)
  calculateLatestTimesCorrect(sortedTasks);

  // 4. Calcul du chemin critique CORRIGÉ
  const criticalPath = calculateCriticalPathCorrect(sortedTasks);

  // 5. Marquer les tâches critiques
  markCriticalTasks(sortedTasks, criticalPath);

  // 6. Optimiser l'ordre d'affichage
  const displayTasks = optimizeTaskDisplay(sortedTasks);

  const projectDuration = Math.max(...sortedTasks.map(t => t.end || 0));

  return {
    tasks: displayTasks,
    criticalPath,
    projectDuration
  };
}

/**
 * TRI TOPOLOGIQUE CORRIGÉ - Algorithme de Kahn
 */
function topologicalSortCorrect(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialisation
  tasks.forEach(task => {
    taskMap.set(task.id, task);
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
  });

  // Construire le graphe et calculer les degrés entrants
  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      if (taskMap.has(predId)) {
        adjList.get(predId)?.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    });
  });

  // Queue des nœuds sans prédécesseurs
  const queue: string[] = [];
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) {
      queue.push(taskId);
    }
  });

  const result: Task[] = [];

  // Algorithme de Kahn
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentTask = taskMap.get(currentId)!;
    result.push(currentTask);

    // Réduire le degré entrant des successeurs
    adjList.get(currentId)?.forEach(successorId => {
      const newDegree = (inDegree.get(successorId) || 0) - 1;
      inDegree.set(successorId, newDegree);

      if (newDegree === 0) {
        queue.push(successorId);
      }
    });
  }

  // Vérification de cycle
  if (result.length !== tasks.length) {
    throw new Error('Cycle détecté dans les dépendances des tâches');
  }

  return result;
}

/**
 * CALCUL DES DATES DE DÉBUT ET FIN (Forward Pass)
 */
function calculateStartAndEndDatesCorrect(tasks: Task[]): void {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  // Les tâches sont déjà triées topologiquement
  tasks.forEach(task => {
    if (task.predecessors.length === 0) {
      task.start = 0;
      task.earliestStart = 0;
    } else {
      // Une tâche commence APRÈS la fin de TOUS ses prédécesseurs
      task.start = Math.max(
          ...task.predecessors.map(predId => {
            const pred = taskMap.get(predId);
            return pred ? (pred.end || 0) : 0;
          })
      );
      task.earliestStart = task.start;
    }

    task.end = (task.start || 0) + task.duration;
    task.earliestFinish = task.end;
  });
}

/**
 * ✅ CALCUL DES DATES AU PLUS TARD (Backward Pass) - CORRIGÉ
 */
function calculateLatestTimesCorrect(tasks: Task[]): void {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  // Fin du projet = max des dates de fin
  const projectEnd = Math.max(...tasks.map(t => t.end || 0));

  // Créer la map des successeurs
  const successorsMap = new Map<string, string[]>();
  tasks.forEach(task => {
    successorsMap.set(task.id, []);
  });

  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      if (successorsMap.has(predId)) {
        successorsMap.get(predId)?.push(task.id);
      }
    });
  });

  // ✅ CORRECTION: Backward pass amélioré
  [...tasks].reverse().forEach(task => {
    const successors = successorsMap.get(task.id) || [];

    if (successors.length === 0) {
      // Tâche finale - peut finir à la fin du projet
      task.latestFinish = projectEnd;
    } else {
      // Finit avant le début au plus tard du plus tôt successeur
      task.latestFinish = Math.min(
          ...successors.map(succId => {
            const succ = taskMap.get(succId);
            return succ?.latestStart ?? projectEnd;
          })
      );
    }

    task.latestStart = (task.latestFinish || 0) - task.duration;
  });
}

/**
 * ✅ CALCUL DU CHEMIN CRITIQUE CORRIGÉ
 */
function calculateCriticalPathCorrect(tasks: Task[]): string[] {
  // Calculer les marges
  tasks.forEach(task => {
    task.slack = (task.latestStart || 0) - (task.start || 0);
  });

  // Le chemin critique = tâches avec marge ≈ 0
  const criticalTasks = tasks.filter(task => Math.abs(task.slack || 0) < 0.001);

  // Construire le chemin critique ordonné
  return buildCriticalPathOrdered(criticalTasks);
}

/**
 * ✅ CONSTRUIRE LE CHEMIN CRITIQUE DANS L'ORDRE LOGIQUE
 */
function buildCriticalPathOrdered(criticalTasks: Task[]): string[] {
  if (criticalTasks.length === 0) return [];

  // Trier les tâches critiques par date de début
  const sortedCritical = criticalTasks.sort((a, b) => (a.start || 0) - (b.start || 0));

  // Construire le chemin en suivant les dépendances
  const criticalPath: string[] = [];
  const criticalIds = new Set(sortedCritical.map(t => t.id));

  // Commencer par les tâches sans prédécesseurs critiques
  let currentTasks = sortedCritical.filter(task =>
      task.predecessors.every(predId => !criticalIds.has(predId))
  );

  while (currentTasks.length > 0) {
    // Ajouter la tâche la plus tôt
    const earliestTask = currentTasks.reduce((earliest, task) =>
        (task.start || 0) < (earliest.start || 0) ? task : earliest
    );

    criticalPath.push(earliestTask.id);

    // Trouver les successeurs critiques
    currentTasks = sortedCritical.filter(task =>
        !criticalPath.includes(task.id) &&
        task.predecessors.some(predId => predId === earliestTask.id)
    );
  }

  // Ajouter les tâches critiques restantes par ordre chronologique
  sortedCritical.forEach(task => {
    if (!criticalPath.includes(task.id)) {
      criticalPath.push(task.id);
    }
  });

  return criticalPath;
}

/**
 * ✅ OPTIMISER L'ORDRE D'AFFICHAGE DES TÂCHES
 */
function optimizeTaskDisplay(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Par date de début
    const startDiff = (a.start || 0) - (b.start || 0);
    if (startDiff !== 0) return startDiff;

    // 2. Tâches critiques en premier à même heure
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;

    // 3. Par durée (plus longues d'abord)
    const durationDiff = (b.duration || 0) - (a.duration || 0);
    if (durationDiff !== 0) return durationDiff;

    // 4. Par ordre alphabétique des IDs
    return a.id.localeCompare(b.id);
  });
}

/**
 * MARQUER LES TÂCHES CRITIQUES
 */
function markCriticalTasks(tasks: Task[], criticalPath: string[]): void {
  const criticalSet = new Set(criticalPath);
  tasks.forEach(task => {
    task.isCritical = criticalSet.has(task.id);

    // Couleur rouge pour les tâches critiques
    if (task.isCritical) {
      task.color = '#DC2626'; // Rouge TailwindCSS
    } else {
      // Couleurs variées pour les tâches normales
      const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];
      const index = tasks.indexOf(task) % colors.length;
      task.color = colors[index];
    }
  });
}