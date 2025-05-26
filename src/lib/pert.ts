import { Task, PertNode, DiagramData, Link, PertActivity, PertDiagram } from './types';

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
  
  // Créer le diagramme PERT avec événements et activités
  const pertDiagram = createPertDiagram(sortedTasks);
  
  return {
    tasks: sortedTasks,
    criticalPath,
    projectDuration,
    pertDiagram
  };
}

/**
 * Crée un diagramme PERT avec événements (nœuds) et activités (arêtes)
 * @param tasks Liste des tâches
 * @returns Diagramme PERT complet
 */
function createPertDiagram(tasks: Task[]): PertDiagram {
  const nodes: PertNode[] = [];
  const activities: PertActivity[] = [];
  const nodeMap = new Map<string, PertNode>();
  
  // Créer le nœud de début du projet
  const startNode: PertNode = {
    id: 'START',
    name: 'Début du projet',
    earliestTime: 0,
    latestTime: 0,
    slack: 0,
    isCritical: true,
    type: 'start'
  };
  nodes.push(startNode);
  nodeMap.set('START', startNode);
  
  // Créer les nœuds pour chaque tâche (événement de fin de tâche)
  tasks.forEach(task => {
    const finishNode: PertNode = {
      id: `FINISH_${task.id}`,
      name: `Fin de ${task.name}`,
      earliestTime: task.earliestFinish || 0,
      latestTime: task.latestFinish || 0,
      slack: task.slack || 0,
      isCritical: task.isCritical || false,
      type: 'milestone'
    };
    nodes.push(finishNode);
    nodeMap.set(`FINISH_${task.id}`, finishNode);
  });
  
  // Créer le nœud de fin du projet
  const projectDuration = Math.max(...tasks.map(t => t.earliestFinish || 0));
  const endTasks = tasks.filter(t => (t.earliestFinish || 0) === projectDuration);
  const endNode: PertNode = {
    id: 'END',
    name: 'Fin du projet',
    earliestTime: projectDuration,
    latestTime: projectDuration,
    slack: 0,
    isCritical: true,
    type: 'end'
  };
  nodes.push(endNode);
  nodeMap.set('END', endNode);
  
  // Créer les activités (tâches sur les arêtes)
  tasks.forEach(task => {
    let sourceNodeId: string;
    
    // Déterminer le nœud source
    if (task.predecessors.length === 0) {
      // Tâche sans prédécesseurs : commence au nœud START
      sourceNodeId = 'START';
    } else if (task.predecessors.length === 1) {
      // Tâche avec un seul prédécesseur
      sourceNodeId = `FINISH_${task.predecessors[0]}`;
    } else {
      // Tâche avec plusieurs prédécesseurs : créer un nœud de convergence
      const convergenceNodeId = `CONVERGENCE_${task.id}`;
      const convergenceNode: PertNode = {
        id: convergenceNodeId,
        name: `Convergence pour ${task.name}`,
        earliestTime: task.earliestStart || 0,
        latestTime: task.latestStart || 0,
        slack: task.slack || 0,
        isCritical: task.isCritical || false,
        type: 'milestone'
      };
      nodes.push(convergenceNode);
      nodeMap.set(convergenceNodeId, convergenceNode);
      
      // Créer des activités fictives (durée 0) des prédécesseurs vers le nœud de convergence
      task.predecessors.forEach(predId => {
        const dummyActivity: PertActivity = {
          id: `DUMMY_${predId}_TO_${task.id}`,
          name: 'Attente',
          duration: 0,
          sourceNodeId: `FINISH_${predId}`,
          targetNodeId: convergenceNodeId,
          earliestStart: nodeMap.get(`FINISH_${predId}`)?.earliestTime || 0,
          earliestFinish: task.earliestStart || 0,
          latestStart: nodeMap.get(`FINISH_${predId}`)?.latestTime || 0,
          latestFinish: task.latestStart || 0,
          slack: Math.min(
            nodeMap.get(`FINISH_${predId}`)?.slack || 0,
            task.slack || 0
          ),
          isCritical: (nodeMap.get(`FINISH_${predId}`)?.isCritical && task.isCritical) || false
        };
        activities.push(dummyActivity);
      });
      
      sourceNodeId = convergenceNodeId;
    }
    
    // Créer l'activité principale
    const activity: PertActivity = {
      id: task.id,
      name: task.name,
      duration: task.duration,
      sourceNodeId,
      targetNodeId: `FINISH_${task.id}`,
      earliestStart: task.earliestStart || 0,
      earliestFinish: task.earliestFinish || 0,
      latestStart: task.latestStart || 0,
      latestFinish: task.latestFinish || 0,
      slack: task.slack || 0,
      isCritical: task.isCritical || false
    };
    activities.push(activity);
  });
  
  // Créer des activités fictives vers le nœud de fin pour les tâches qui n'ont pas de successeurs
  const hasSuccessors = new Set<string>();
  tasks.forEach(task => {
    task.predecessors.forEach(predId => hasSuccessors.add(predId));
  });
  
  tasks.forEach(task => {
    if (!hasSuccessors.has(task.id)) {
      const endActivity: PertActivity = {
        id: `END_${task.id}`,
        name: 'Vers fin projet',
        duration: 0,
        sourceNodeId: `FINISH_${task.id}`,
        targetNodeId: 'END',
        earliestStart: task.earliestFinish || 0,
        earliestFinish: projectDuration,
        latestStart: task.latestFinish || 0,
        latestFinish: projectDuration,
        slack: task.slack || 0,
        isCritical: task.isCritical || false
      };
      activities.push(endActivity);
    }
  });
  
  return { nodes, activities };
}

/**
 * Organise les nœuds PERT en niveaux pour le rendu
 * @param pertDiagram Diagramme PERT
 * @returns Diagramme PERT avec positions calculées
 */
export function layoutPertDiagram(pertDiagram: PertDiagram): PertDiagram {
  const { nodes, activities } = pertDiagram;
  
  // Calculer les rangs (niveaux) des nœuds
  const ranks = calculateNodeRanks(nodes, activities);
  
  // Calculer les positions
  const horizontalSpacing = 250;
  const verticalSpacing = 120;
  
  // Organiser les nœuds par rang
  const nodesByRank = new Map<number, PertNode[]>();
  ranks.forEach((rank, nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      if (!nodesByRank.has(rank)) {
        nodesByRank.set(rank, []);
      }
      nodesByRank.get(rank)?.push(node);
    }
  });
  
  // Calculer les positions
  nodesByRank.forEach((rankNodes, rank) => {
    const x = rank * horizontalSpacing;
    rankNodes.forEach((node, index) => {
      node.x = x;
      node.y = index * verticalSpacing + 100;
    });
  });
  
  return { nodes, activities };
}

/**
 * Calcule les rangs des nœuds pour le positionnement
 * @param nodes Liste des nœuds
 * @param activities Liste des activités
 * @returns Map des rangs par nœud
 */
function calculateNodeRanks(nodes: PertNode[], activities: PertActivity[]): Map<string, number> {
  const ranks = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  
  // Initialiser
  nodes.forEach(node => {
    incomingCount.set(node.id, 0);
    outgoing.set(node.id, []);
  });
  
  // Compter les arêtes entrantes et sortantes
  activities.forEach(activity => {
    const currentCount = incomingCount.get(activity.targetNodeId) || 0;
    incomingCount.set(activity.targetNodeId, currentCount + 1);
    
    const currentOutgoing = outgoing.get(activity.sourceNodeId) || [];
    currentOutgoing.push(activity.targetNodeId);
    outgoing.set(activity.sourceNodeId, currentOutgoing);
  });
  
  // Algorithme de tri topologique
  const queue: string[] = [];
  let currentRank = 0;
  
  // Commencer par les nœuds sans prédécesseurs
  incomingCount.forEach((count, nodeId) => {
    if (count === 0) {
      queue.push(nodeId);
      ranks.set(nodeId, currentRank);
    }
  });
  
  while (queue.length > 0) {
    const nextQueue: string[] = [];
    
    queue.forEach(nodeId => {
      const successors = outgoing.get(nodeId) || [];
      successors.forEach(successorId => {
        const count = incomingCount.get(successorId) || 0;
        incomingCount.set(successorId, count - 1);
        
        if (count - 1 === 0 && !ranks.has(successorId)) {
          nextQueue.push(successorId);
          ranks.set(successorId, currentRank + 1);
        }
      });
    });
    
    queue.length = 0;
    queue.push(...nextQueue);
    currentRank++;
  }
  
  return ranks;
}

// Les autres fonctions restent identiques à la version précédente
/**
 * Trie topologiquement les tâches en fonction de leurs dépendances
 * @param tasks Liste des tâches
 * @returns Liste des tâches triées
 */
function topologicalSort(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  const visited = new Set<string>();
  const temp = new Set<string>();
  const result: Task[] = [];
  
  function dfs(taskId: string): void {
    if (visited.has(taskId)) return;
    if (temp.has(taskId)) {
      console.error(`Cycle détecté dans les dépendances des tâches: ${taskId}`);
      return;
    }
    
    temp.add(taskId);
    
    const task = taskMap.get(taskId);
    if (task) {
      task.predecessors.forEach(predId => {
        if (taskMap.has(predId)) {
          dfs(predId);
        }
      });
    }
    
    temp.delete(taskId);
    visited.add(taskId);
    if (task) {
      result.unshift(task);
    }
  }
  
  const rootTasks = tasks.filter(task => task.predecessors.length === 0);
  
  if (rootTasks.length === 0 && tasks.length > 0) {
    dfs(tasks[0].id);
  } else {
    rootTasks.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id);
      }
    });
  }
  
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
 * Calcule les dates au plus tard (late start/finish)
 * @param tasks Liste des tâches triées topologiquement
 */
function calculateLatestTimes(tasks: Task[]): void {
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  const successorsMap = new Map<string, string[]>();
  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      if (!successorsMap.has(predId)) {
        successorsMap.set(predId, []);
      }
      successorsMap.get(predId)?.push(task.id);
    });
  });
  
  const projectEnd = Math.max(...tasks.map(t => t.earliestFinish || 0));
  
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
 * Calcule les marges et identifie le chemin critique
 * @param tasks Liste des tâches
 */
function calculateSlackAndCriticalPath(tasks: Task[]): void {
  tasks.forEach(task => {
    task.slack = (task.latestStart || 0) - (task.earliestStart || 0);
    task.isCritical = task.slack === 0;
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
