// src/lib/pert.ts - VERSION ENTIÈREMENT CORRIGÉE

import { Task, PertNode, DiagramData, Link } from './types';

export function calculatePertData(tasks: Task[]): DiagramData {
  const workingTasks = JSON.parse(JSON.stringify(tasks)) as Task[];

  // 1. Tri topologique (même algorithme que Gantt)
  const sortedTasks = topologicalSortCorrect(workingTasks);

  // 2. PERT - Forward Pass (dates au plus tôt)
  calculateForwardPass(sortedTasks);

  // 3. PERT - Backward Pass (dates au plus tard)
  calculateBackwardPass(sortedTasks);

  // 4. Calcul des marges et chemin critique
  calculateSlackAndCriticalPath(sortedTasks);

  const projectDuration = Math.max(...sortedTasks.map(t => t.earliestFinish || 0));
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
 * FORWARD PASS - Calcul des dates au plus tôt
 */
function calculateForwardPass(tasks: Task[]): void {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  tasks.forEach(task => {
    if (task.predecessors.length === 0) {
      task.earliestStart = 0;
    } else {
      task.earliestStart = Math.max(
          ...task.predecessors.map(predId => {
            const pred = taskMap.get(predId);
            return pred ? (pred.earliestFinish || 0) : 0;
          })
      );
    }

    task.earliestFinish = (task.earliestStart || 0) + task.duration;
  });
}

/**
 * BACKWARD PASS - Calcul des dates au plus tard
 */
function calculateBackwardPass(tasks: Task[]): void {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  // Fin du projet
  const projectEnd = Math.max(...tasks.map(t => t.earliestFinish || 0));

  // Map des successeurs
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

  // Backward pass
  [...tasks].reverse().forEach(task => {
    const successors = successorsMap.get(task.id) || [];

    if (successors.length === 0) {
      task.latestFinish = projectEnd;
    } else {
      task.latestFinish = Math.min(
          ...successors.map(succId => {
            const succ = taskMap.get(succId);
            return succ ? (succ.latestStart || projectEnd) : projectEnd;
          })
      );
    }

    task.latestStart = (task.latestFinish || 0) - task.duration;
  });
}

/**
 * CALCUL DES MARGES ET CHEMIN CRITIQUE
 */
function calculateSlackAndCriticalPath(tasks: Task[]): void {
  tasks.forEach(task => {
    // Marge = LS - ES (ou LF - EF)
    task.slack = (task.latestStart || 0) - (task.earliestStart || 0);

    // Chemin critique = marge nulle
    task.isCritical = Math.abs(task.slack || 0) < 0.001;

    // Pour compatibilité Gantt
    task.start = task.earliestStart;
    task.end = task.earliestFinish;
  });
}

/**
 * CRÉER LES NŒUDS PERT AVEC FORMAT CORRECT
 */
export function createPertNodes(tasks: Task[]): PertNode[] {
  return tasks.map(task => ({
    id: task.id,
    name: task.name || "Unnamed",
    earliestStart: task.earliestStart || 0,
    earliestFinish: task.earliestFinish || 0,
    latestStart: task.latestStart || 0,
    latestFinish: task.latestFinish || 0,
    slack: task.slack || 0,
    isCritical: task.isCritical || false,
    duration: task.duration,
    x: 0,
    y: 0,
    level: task.level || 0 // ✅ Ajout de la propriété level
  }));
}

/**
 * CRÉER LES LIENS PERT
 */
export function createPertLinks(tasks: Task[]): Link[] {
  const links: Link[] = [];

  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      links.push({
        source: predId,
        target: task.id,
        type: 'finish-to-start'
      });
    });
  });

  return links;
}

/**
 * LAYOUT INTELLIGENT POUR PERT - Par niveaux logiques CORRIGÉ
 */
export function layoutPertNodes(
    nodes: PertNode[],
    links: Link[],
    dimensions = { width: 1000, height: 600 }
): PertNode[] {
  const workingNodes = [...nodes];

  // 1. Calculer les niveaux basés sur les dépendances (algorithme de Kahn modifié)
  const nodeMap = new Map<string, PertNode>();
  workingNodes.forEach(node => nodeMap.set(node.id, node));

  // Créer une map des prédécesseurs pour chaque nœud
  const predecessorsMap = new Map<string, string[]>();
  workingNodes.forEach(node => {
    predecessorsMap.set(node.id, []);
  });

  links.forEach(link => {
    if (!predecessorsMap.has(link.target)) {
      predecessorsMap.set(link.target, []);
    }
    predecessorsMap.get(link.target)?.push(link.source);
  });

  // Calculer le niveau de chaque nœud
  const levels = new Map<number, PertNode[]>();
  const visited = new Set<string>();

  function calculateLevel(nodeId: string): number {
    if (visited.has(nodeId)) {
      const node = nodeMap.get(nodeId);
      return node?.level ?? 0;
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId)!;
    const preds = predecessorsMap.get(nodeId) || [];

    if (preds.length === 0) {
      node.level = 0;
    } else {
      node.level = Math.max(...preds.map(predId => calculateLevel(predId))) + 1;
    }

    // Ajouter au niveau correspondant
    if (!levels.has(node.level)) {
      levels.set(node.level, []);
    }
    levels.get(node.level)?.push(node);

    return node.level;
  }

  // Calculer les niveaux pour tous les nœuds
  workingNodes.forEach(node => calculateLevel(node.id));

  // 2. Positionner les nœuds par niveau
  const levelSpacing = 300; // Distance horizontale entre niveaux
  const nodeSpacing = 120;  // Distance verticale entre nœuds du même niveau

  // Trier les niveaux par clé
  const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);

  sortedLevels.forEach(levelIndex => {
    const levelNodes = levels.get(levelIndex) || [];
    const x = levelIndex * levelSpacing + 50; // Position X du niveau

    // Calculer la hauteur totale nécessaire pour ce niveau
    const totalHeight = levelNodes.length * nodeSpacing;
    const startY = Math.max(50, (dimensions.height - totalHeight) / 2);

    levelNodes.forEach((node, nodeIndex) => {
      node.x = x;
      node.y = startY + nodeIndex * nodeSpacing;
    });
  });

  return workingNodes;
}

/**
 * TRI TOPOLOGIQUE CORRECT
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

  // Construire le graphe
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

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentTask = taskMap.get(currentId)!;
    result.push(currentTask);

    adjList.get(currentId)?.forEach(successorId => {
      const newDegree = (inDegree.get(successorId) || 0) - 1;
      inDegree.set(successorId, newDegree);

      if (newDegree === 0) {
        queue.push(successorId);
      }
    });
  }

  if (result.length !== tasks.length) {
    throw new Error('Cycle détecté dans les dépendances des tâches');
  }

  return result;
}