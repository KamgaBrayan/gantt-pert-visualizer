// src/lib/pert-refactored.ts - VERSION OPTIMISÉE ET REFACTORISÉE

import { Task, PertNode, DiagramData, Link } from './types';

/**
 * Interface pour les paramètres de calcul PERT
 */
interface PertCalculationParams {
  tasks: Task[];
  validateCycles?: boolean;
  toleranceSlack?: number;
}

/**
 * Interface pour la configuration du layout
 */
interface LayoutConfig {
  width: number;
  height: number;
  levelSpacing: number;
  nodeSpacing: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

/**
 * Classe utilitaire pour les calculs PERT
 */
class PertCalculator {
  private taskMap: Map<string, Task>;
  private successorsMap: Map<string, string[]>;
  private predecessorsMap: Map<string, string[]>;
  private toleranceSlack: number;

  constructor(tasks: Task[], toleranceSlack = 0.001) {
    this.toleranceSlack = toleranceSlack;
    this.taskMap = new Map();
    this.successorsMap = new Map();
    this.predecessorsMap = new Map();
    this.initializeMaps(tasks);
  }

  /**
   * Initialisation des maps pour optimiser les accès
   */
  private initializeMaps(tasks: Task[]): void {
    // Initialiser les maps
    tasks.forEach(task => {
      this.taskMap.set(task.id, task);
      this.successorsMap.set(task.id, []);
      this.predecessorsMap.set(task.id, [...task.predecessors]);
    });

    // Construire la map des successeurs
    tasks.forEach(task => {
      task.predecessors.forEach(predId => {
        if (this.successorsMap.has(predId)) {
          this.successorsMap.get(predId)?.push(task.id);
        }
      });
    });
  }

  /**
   * Tri topologique avec détection de cycles optimisée
   */
  public topologicalSort(): Task[] {
    const inDegree = new Map<string, number>();
    const result: Task[] = [];

    // Initialiser les degrés entrants
    this.taskMap.forEach((task, id) => {
      inDegree.set(id, this.predecessorsMap.get(id)?.length || 0);
    });

    // Queue des tâches sans prédécesseurs
    const queue: string[] = [];
    inDegree.forEach((degree, taskId) => {
      if (degree === 0) queue.push(taskId);
    });

    // Algorithme de Kahn
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentTask = this.taskMap.get(currentId)!;
      result.push(currentTask);

      // Réduire le degré des successeurs
      const successors = this.successorsMap.get(currentId) || [];
      successors.forEach(successorId => {
        const newDegree = (inDegree.get(successorId) || 0) - 1;
        inDegree.set(successorId, newDegree);

        if (newDegree === 0) {
          queue.push(successorId);
        }
      });
    }

    // Vérification des cycles
    if (result.length !== this.taskMap.size) {
      const remainingTasks = Array.from(this.taskMap.keys())
          .filter(id => !result.some(task => task.id === id));
      throw new Error(`Cycle détecté dans les dépendances: ${remainingTasks.join(', ')}`);
    }

    return result;
  }

  /**
   * Forward Pass - Calcul optimisé des dates au plus tôt
   */
  public calculateForwardPass(sortedTasks: Task[]): void {
    sortedTasks.forEach(task => {
      const predecessors = this.predecessorsMap.get(task.id) || [];

      if (predecessors.length === 0) {
        task.earliestStart = 0;
      } else {
        task.earliestStart = Math.max(
            ...predecessors.map(predId => {
              const pred = this.taskMap.get(predId);
              return pred?.earliestFinish ?? 0;
            })
        );
      }

      task.earliestFinish = task.earliestStart + task.duration;
    });
  }

  /**
   * Backward Pass - Calcul optimisé des dates au plus tard
   */
  public calculateBackwardPass(sortedTasks: Task[]): void {
    const projectEnd = Math.max(...sortedTasks.map(t => t.earliestFinish ?? 0));

    // Parcours inverse pour le backward pass
    [...sortedTasks].reverse().forEach(task => {
      const successors = this.successorsMap.get(task.id) || [];

      if (successors.length === 0) {
        task.latestFinish = projectEnd;
      } else {
        task.latestFinish = Math.min(
            ...successors.map(succId => {
              const succ = this.taskMap.get(succId);
              return succ?.latestStart ?? projectEnd;
            })
        );
      }

      task.latestStart = task.latestFinish - task.duration;
    });
  }

  /**
   * Calcul des marges et identification du chemin critique
   */
  public calculateSlackAndCriticalPath(tasks: Task[]): string[] {
    const criticalPath: string[] = [];

    tasks.forEach(task => {
      // Calcul de la marge (slack)
      task.slack = (task.latestStart ?? 0) - (task.earliestStart ?? 0);

      // Détermination si la tâche est critique
      task.isCritical = Math.abs(task.slack) < this.toleranceSlack;

      // Compatibilité avec Gantt
      task.start = task.earliestStart;
      task.end = task.earliestFinish;

      // Construction du chemin critique
      if (task.isCritical) {
        criticalPath.push(task.id);
      }
    });

    return this.orderCriticalPath(criticalPath, tasks);
  }

  /**
   * Ordonner le chemin critique selon les dépendances
   */
  private orderCriticalPath(criticalTaskIds: string[], tasks: Task[]): string[] {
    const criticalTasks = tasks.filter(t => criticalTaskIds.includes(t.id));

    // Tri par earliestStart pour avoir l'ordre chronologique
    return criticalTasks
        .sort((a, b) => (a.earliestStart ?? 0) - (b.earliestStart ?? 0))
        .map(t => t.id);
  }
}

/**
 * Classe pour la gestion du layout PERT
 */
class PertLayoutManager {
  private config: LayoutConfig;
  private nodeMap: Map<string, PertNode>;
  private levels: Map<number, PertNode[]>;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.nodeMap = new Map();
    this.levels = new Map();
  }

  /**
   * Calcul des niveaux hiérarchiques optimisé
   */
  public calculateLevels(nodes: PertNode[], links: Link[]): void {
    // Réinitialiser
    this.nodeMap.clear();
    this.levels.clear();

    nodes.forEach(node => this.nodeMap.set(node.id, node));

    // Construire la map des prédécesseurs
    const predecessorsMap = new Map<string, string[]>();
    nodes.forEach(node => predecessorsMap.set(node.id, []));

    links.forEach(link => {
      if (predecessorsMap.has(link.target)) {
        predecessorsMap.get(link.target)?.push(link.source);
      }
    });

    // Calcul récursif des niveaux avec mémoïsation
    const visited = new Set<string>();

    const calculateLevel = (nodeId: string): number => {
      if (visited.has(nodeId)) {
        return this.nodeMap.get(nodeId)?.level ?? 0;
      }

      visited.add(nodeId);
      const node = this.nodeMap.get(nodeId)!;
      const preds = predecessorsMap.get(nodeId) || [];

      node.level = preds.length === 0 ? 0 :
          Math.max(...preds.map(predId => calculateLevel(predId))) + 1;

      // Ajouter au niveau approprié
      if (!this.levels.has(node.level)) {
        this.levels.set(node.level, []);
      }
      this.levels.get(node.level)?.push(node);

      return node.level;
    };

    nodes.forEach(node => calculateLevel(node.id));
  }

  /**
   * Positionnement optimisé des nœuds
   */
  public positionNodes(): PertNode[] {
    const maxLevel = Math.max(...Array.from(this.levels.keys()));
    const levelSpacing = Math.min(
        this.config.levelSpacing,
        (this.config.width - this.config.margin.left - this.config.margin.right) / (maxLevel + 1)
    );

    // Calculer l'espacement vertical adaptatif
    const maxNodesInLevel = Math.max(...Array.from(this.levels.values()).map(nodes => nodes.length));
    const nodeSpacing = Math.min(
        this.config.nodeSpacing,
        (this.config.height - this.config.margin.top - this.config.margin.bottom) / maxNodesInLevel
    );

    // Positionner chaque niveau
    Array.from(this.levels.keys()).sort((a, b) => a - b).forEach(levelIndex => {
      const levelNodes = this.levels.get(levelIndex) || [];
      const x = levelIndex * levelSpacing + this.config.margin.left;

      // Centrage vertical
      const totalHeight = (levelNodes.length - 1) * nodeSpacing;
      const startY = this.config.margin.top + Math.max(0, (this.config.height - this.config.margin.top - this.config.margin.bottom - totalHeight) / 2);

      levelNodes.forEach((node, nodeIndex) => {
        node.x = x;
        node.y = startY + nodeIndex * nodeSpacing;
      });
    });

    return Array.from(this.nodeMap.values());
  }
}

/**
 * FONCTIONS PUBLIQUES OPTIMISÉES
 */

/**
 * Calcul principal des données PERT - Version optimisée
 */
export function calculatePertData(
    tasks: Task[],
    options: Partial<PertCalculationParams> = {}
): DiagramData {
  const { validateCycles = true, toleranceSlack = 0.001 } = options;

  if (!tasks.length) {
    throw new Error('Aucune tâche fournie pour le calcul PERT');
  }

  // Validation des tâches
  validateTasks(tasks);

  const calculator = new PertCalculator(tasks, toleranceSlack);

  try {
    // 1. Tri topologique
    const sortedTasks = calculator.topologicalSort();

    // 2. Forward Pass
    calculator.calculateForwardPass(sortedTasks);

    // 3. Backward Pass
    calculator.calculateBackwardPass(sortedTasks);

    // 4. Calcul des marges et chemin critique
    const criticalPath = calculator.calculateSlackAndCriticalPath(sortedTasks);

    const projectDuration = Math.max(...sortedTasks.map(t => t.earliestFinish ?? 0));

    return {
      tasks: sortedTasks,
      criticalPath,
      projectDuration
    };

  } catch (error) {
    throw new Error(`Erreur dans le calcul PERT: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Création des nœuds PERT optimisée
 */
export function createPertNodes(tasks: Task[]): PertNode[] {
  return tasks.map(task => ({
    id: task.id,
    name: task.name || "Tâche sans nom",
    earliestStart: task.earliestStart ?? 0,
    earliestFinish: task.earliestFinish ?? 0,
    latestStart: task.latestStart ?? 0,
    latestFinish: task.latestFinish ?? 0,
    slack: task.slack ?? 0,
    isCritical: task.isCritical ?? false,
    duration: task.duration,
    x: 0,
    y: 0,
    level: 0
  }));
}

/**
 * Création des liens PERT avec gestion des types
 */
export function createPertLinks(tasks: Task[]): Link[] {
  const links: Link[] = [];
  const taskIds = new Set(tasks.map(t => t.id));

  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      // Validation de l'existence du prédécesseur
      if (!taskIds.has(predId)) {
        console.warn(`Prédécesseur ${predId} non trouvé pour la tâche ${task.id}`);
        return;
      }

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
 * Layout intelligent des nœuds PERT
 */
export function layoutPertNodes(
    nodes: PertNode[],
    links: Link[],
    dimensions = { width: 1000, height: 600 }
): PertNode[] {
  const config: LayoutConfig = {
    width: dimensions.width,
    height: dimensions.height,
    levelSpacing: 350,
    nodeSpacing: 140,
    margin: { top: 80, right: 80, bottom: 80, left: 80 }
  };

  const layoutManager = new PertLayoutManager(config);

  // Calculer les niveaux
  layoutManager.calculateLevels(nodes, links);

  // Positionner les nœuds
  return layoutManager.positionNodes();
}

/**
 * FONCTIONS UTILITAIRES
 */

/**
 * Validation des tâches d'entrée
 */
function validateTasks(tasks: Task[]): void {
  const errors: string[] = [];
  const taskIds = new Set<string>();

  tasks.forEach((task, index) => {
    // Validation de base
    if (!task.id || typeof task.id !== 'string') {
      errors.push(`Tâche ${index}: ID manquant ou invalide`);
    } else if (taskIds.has(task.id)) {
      errors.push(`Tâche ${task.id}: ID dupliqué`);
    } else {
      taskIds.add(task.id);
    }

    if (!task.name || typeof task.name !== 'string') {
      errors.push(`Tâche ${task.id || index}: Nom manquant ou invalide`);
    }

    if (typeof task.duration !== 'number' || task.duration <= 0) {
      errors.push(`Tâche ${task.id || index}: Durée invalide (doit être > 0)`);
    }

    if (!Array.isArray(task.predecessors)) {
      errors.push(`Tâche ${task.id || index}: Prédécesseurs invalides (doit être un tableau)`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Validation échouée:\n${errors.join('\n')}`);
  }
}

/**
 * Utilitaire pour diagnostiquer les problèmes de performance
 */
export function diagnosticPertCalculation(tasks: Task[]): {
  taskCount: number;
  linkCount: number;
  maxLevel: number;
  cycleDetected: boolean;
  performanceMetrics: {
    calculationTime: number;
    memoryUsage: string;
  };
} {
  const startTime = performance.now();

  try {
    const result = calculatePertData(tasks);
    const endTime = performance.now();

    const links = createPertLinks(tasks);
    const nodes = createPertNodes(result.tasks);
    const positionedNodes = layoutPertNodes(nodes, links);

    const maxLevel = Math.max(...positionedNodes.map(n => n.level || 0));

    return {
      taskCount: tasks.length,
      linkCount: links.length,
      maxLevel,
      cycleDetected: false,
      performanceMetrics: {
        calculationTime: endTime - startTime,
        memoryUsage: `${Math.round(JSON.stringify(result).length / 1024)} KB`
      }
    };
  } catch (error) {
    return {
      taskCount: tasks.length,
      linkCount: 0,
      maxLevel: 0,
      cycleDetected: error instanceof Error && error.message.includes('Cycle'),
      performanceMetrics: {
        calculationTime: performance.now() - startTime,
        memoryUsage: 'N/A'
      }
    };
  }
}