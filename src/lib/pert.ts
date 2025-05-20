import { Task, PertNode, DiagramData, Link } from './types';

/**
 * Calcule les données pour un diagramme PERT
 * @param tasks Liste des tâches
 * @returns Données calculées pour le diagramme PERT
 */
export function calculatePertData(tasks: Task[]): DiagramData {
  // Copie profonde des tâches pour ne pas modifier les originales
  const workingTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  
  // Trie topologique pour respecter les dépendances
  const sortedTasks = topologicalSort(workingTasks);
  
  // Calcul des dates au plus tôt
  calculateEarliestTimes(sortedTasks);
  
  // Calcul des dates au plus tard
  calculateLatestTimes(sortedTasks);
  
  // Calcul des marges et du chemin critique
  calculateSlackAndCriticalPath(sortedTasks);
  
  // Calcul de la durée totale du projet
  const projectDuration = calculateProjectDuration(sortedTasks);
  
  // Identifier le chemin critique
  const criticalPath = sortedTasks
    .filter(task => task.isCritical)
    .map(task => task.id);
  
  // Attribution de couleurs
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
 * Calcule les dates au plus tôt (early start/finish)
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
    } else {
      // Sinon, commence après la fin au plus tôt de tous les prédécesseurs
      task.earliestStart = Math.max(
        ...task.predecessors.map(predId => {
          const pred = taskMap.get(predId);
          return pred ? (pred.earliestFinish || 0) : 0;
        })
      );
    }
    
    // Calcule la date de fin au plus tôt
    task.earliestFinish = (task.earliestStart || 0) + task.duration;
  });
}

/**
 * Calcule les dates au plus tard (late start/finish)
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
    
    // Une tâche est critique si sa marge est nulle
    task.isCritical = task.slack === 0;
    
    // Mise à jour des dates de début et fin pour le diagramme de Gantt
    task.start = task.earliestStart;
    task.end = task.earliestFinish;
  });
}

/**
 * Calcule la durée totale du projet
 * @param tasks Liste des tâches
 * @returns Durée totale du projet
 */
function calculateProjectDuration(tasks: Task[]): number {
  return Math.max(...tasks.map(t => t.earliestFinish || 0));
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
  
  // Grouper les tâches par niveau topologique
  const levels = new Map<number, Task[]>();
  
  // Calculer le niveau de chaque tâche
  const taskLevels = new Map<string, number>();
  
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Calculer le niveau de chaque tâche
  function calculateLevel(taskId: string, currentLevel: number): number {
    if (taskLevels.has(taskId)) {
      return taskLevels.get(taskId) || 0;
    }
    
    const task = taskMap.get(taskId);
    if (!task) return currentLevel;
    
    // Si pas de prédécesseurs, niveau 0
    if (task.predecessors.length === 0) {
      taskLevels.set(taskId, 0);
      return 0;
    }
    
    // Sinon, niveau = max(niveaux des prédécesseurs) + 1
    const predLevels = task.predecessors.map(predId => 
      calculateLevel(predId, currentLevel + 1)
    );
    
    const level = Math.max(...predLevels) + 1;
    taskLevels.set(taskId, level);
    
    return level;
  }
  
  // Calculer les niveaux
  tasks.forEach(task => {
    const level = calculateLevel(task.id, 0);
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)?.push(task);
  });
  
  // Attribuer des couleurs par niveau
  levels.forEach((levelTasks, level) => {
    const color = colors[level % colors.length];
    levelTasks.forEach(task => {
      // Les tâches critiques restent rouges
      task.color = task.isCritical ? '#EA4335' : color;
    });
  });
}

/**
 * Crée des nœuds pour le diagramme PERT
 * @param tasks Liste des tâches
 * @returns Liste des nœuds pour le diagramme PERT
 */
export function createPertNodes(tasks: Task[]): PertNode[] {
  return tasks.map(task => ({
    id: task.id,
    name: task.name,
    earliestStart: task.earliestStart || 0,
    earliestFinish: task.earliestFinish || 0,
    latestStart: task.latestStart || 0,
    latestFinish: task.latestFinish || 0,
    slack: task.slack || 0,
    isCritical: task.isCritical || false,
    duration: task.duration
  }));
}

/**
 * Crée des liens pour le diagramme PERT
 * @param tasks Liste des tâches
 * @returns Liste des liens pour le diagramme PERT
 */
export function createPertLinks(tasks: Task[]): Link[] {
  const links: Link[] = [];
  
  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      links.push({
        source: predId,
        target: task.id,
        type: 'end-start' // Par défaut, fin-début
      });
    });
  });
  
  return links;
}

/**
 * Organise les nœuds en niveaux pour le diagramme PERT
 * @param nodes Liste des nœuds
 * @param links Liste des liens
 * @returns Nœuds avec positions calculées
 */
export function layoutPertNodes(nodes: PertNode[], links: Link[]): PertNode[] {
  // Map pour un accès rapide aux nœuds par ID
  const nodeMap = new Map<string, PertNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Calculer les niveaux (rangs)
  const ranks = calculateRanks(nodes, links);
  
  // Calculer la position Y pour chaque niveau
  const yByRank = new Map<number, number>();
  let y = 0;
  const verticalSpacing = 100;
  
  // Trier les rangs
  const sortedRanks = Array.from(ranks.keys()).sort((a, b) => a - b);
  
  // Calculer la position Y pour chaque rang
  sortedRanks.forEach(rank => {
    yByRank.set(rank, y);
    y += verticalSpacing;
  });
  
  // Calculer la position X pour chaque nœud dans son niveau
  const horizontalSpacing = 200;
  
  sortedRanks.forEach(rank => {
    const rankNodes = ranks.get(rank) || [];
    const x0 = (rank * horizontalSpacing);
    
    rankNodes.forEach((nodeId, i) => {
      const node = nodeMap.get(nodeId);
      if (node) {
        node.x = x0;
        node.y = yByRank.get(rank) || 0;
      }
    });
  });
  
  return nodes;
}

/**
 * Calcule les rangs (niveaux) pour le diagramme PERT en utilisant la méthode des niveaux
 * @param nodes Liste des nœuds
 * @param links Liste des liens
 * @returns Map des nœuds par rang
 */
function calculateRanks(nodes: PertNode[], links: Link[]): Map<number, string[]> {
  // Map des prédécesseurs de chaque nœud
  const predecessors = new Map<string, Set<string>>();
  
  // Map des successeurs de chaque nœud
  const successors = new Map<string, Set<string>>();
  
  // Initialiser les maps
  nodes.forEach(node => {
    predecessors.set(node.id, new Set<string>());
    successors.set(node.id, new Set<string>());
  });
  
  // Remplir les maps avec les liens
  links.forEach(link => {
    predecessors.get(link.target)?.add(link.source);
    successors.get(link.source)?.add(link.target);
  });
  
  // Rangs des nœuds (niveaux)
  const ranks = new Map<number, string[]>();
  
  // Nœuds visités
  const visited = new Set<string>();
  
  // Niveau 1 : Nœuds sans prédécesseurs (sources)
  const sources = nodes
    .filter(node => (predecessors.get(node.id)?.size || 0) === 0)
    .map(node => node.id);
  
  // Rang initial (0)
  ranks.set(0, [...sources]);
  sources.forEach(id => visited.add(id));
  
  // Calculer les niveaux suivants selon la méthode des niveaux
  let currentRank = 0;
  
  while (visited.size < nodes.length) {
    const currentNodes = ranks.get(currentRank) || [];
    const nextRankNodes: string[] = [];
    
    currentNodes.forEach(nodeId => {
      // Parcourir les successeurs
      successors.get(nodeId)?.forEach(succId => {
        // Vérifier si tous les prédécesseurs sont visités
        const predSet = predecessors.get(succId);
        if (predSet && Array.from(predSet).every(id => visited.has(id))) {
          // Si tous les prédécesseurs sont visités et le nœud n'est pas déjà visité
          if (!visited.has(succId)) {
            nextRankNodes.push(succId);
            visited.add(succId);
          }
        }
      });
    });
    
    // Passer au rang suivant
    currentRank++;
    if (nextRankNodes.length > 0) {
      ranks.set(currentRank, nextRankNodes);
    }
  }
  
  return ranks;
}