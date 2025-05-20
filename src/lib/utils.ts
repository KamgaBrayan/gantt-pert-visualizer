import { Task, TaskImportFormat } from './types';

/**
 * Génère un ID unique pour une tâche
 * @returns ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Valide une liste de tâches
 * @param tasks Liste des tâches à valider
 * @returns Objet contenant le résultat de la validation et les erreurs éventuelles
 */
export function validateTasks(tasks: Task[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const taskIds = new Set<string>();
  
  // Vérifier que chaque tâche a un ID unique
  tasks.forEach(task => {
    if (taskIds.has(task.id)) {
      errors.push(`La tâche "${task.name}" a un ID en double: ${task.id}`);
    }
    taskIds.add(task.id);
  });
  
  // Vérifier que chaque prédécesseur existe
  tasks.forEach(task => {
    task.predecessors.forEach(predId => {
      if (!taskIds.has(predId)) {
        errors.push(`La tâche "${task.name}" a un prédécesseur inexistant: ${predId}`);
      }
    });
  });
  
  // Vérifier qu'il n'y a pas de cycles
  if (hasCycle(tasks)) {
    errors.push('Il y a un cycle dans les dépendances des tâches');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Vérifie s'il y a un cycle dans le graphe des tâches
 * @param tasks Liste des tâches
 * @returns true s'il y a un cycle, false sinon
 */
function hasCycle(tasks: Task[]): boolean {
  // Map pour un accès rapide aux tâches par ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));
  
  // Ensemble des nœuds visités dans le parcours en cours
  const visiting = new Set<string>();
  // Ensemble des nœuds complètement visités
  const visited = new Set<string>();
  
  // Fonction récursive pour détecter un cycle
  function detectCycle(taskId: string): boolean {
    // Si déjà visité complètement, pas de cycle
    if (visited.has(taskId)) return false;
    // Si en cours de visite, cycle détecté
    if (visiting.has(taskId)) return true;
    
    // Marquer comme en cours de visite
    visiting.add(taskId);
    
    // Vérifier les prédécesseurs
    const task = taskMap.get(taskId);
    if (task) {
      for (const predId of task.predecessors) {
        if (detectCycle(predId)) {
          return true;
        }
      }
    }
    
    // Marquer comme complètement visité
    visiting.delete(taskId);
    visited.add(taskId);
    
    return false;
  }
  
  // Vérifier chaque tâche
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (detectCycle(task.id)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Parse un fichier CSV en liste de tâches
 * @param csv Contenu du fichier CSV
 * @returns Liste des tâches
 */
export function parseCSV(csv: string): Task[] {
  const lines = csv.trim().split('\n');
  
  // Vérifier s'il y a un en-tête
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const hasHeader = headers.includes('nom') || 
                   headers.includes('tâche') || 
                   headers.includes('task') || 
                   headers.includes('name');
  
  // Indices des colonnes
  let nameIndex = headers.findIndex(h => h === 'nom' || h === 'tâche' || h === 'task' || h === 'name');
  let durationIndex = headers.findIndex(h => h === 'durée' || h === 'duree' || h === 'duration');
  let predecessorsIndex = headers.findIndex(h => 
    h === 'prédécesseurs' || 
    h === 'predecesseurs' || 
    h === 'predecessors' || 
    h === 'antériorité' || 
    h === 'anteriorite'
  );
  
  // Si pas d'en-tête, utiliser l'ordre par défaut
  if (!hasHeader) {
    nameIndex = 0;
    durationIndex = 1;
    predecessorsIndex = 2;
  }
  
  // Commencer à la deuxième ligne si en-tête
  const startIndex = hasHeader ? 1 : 0;
  const tasks: Task[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim());
    
    // Ignorer les lignes incomplètes
    if (values.length <= Math.max(nameIndex, durationIndex)) continue;
    
    const name = values[nameIndex];
    const duration = parseInt(values[durationIndex], 10);
    
    // Prédécesseurs (peuvent être vides)
    let predecessors: string[] = [];
    if (predecessorsIndex >= 0 && values[predecessorsIndex]) {
      predecessors = values[predecessorsIndex]
        .split(';')
        .map(p => p.trim())
        .filter(Boolean);
    }
    
    tasks.push({
      id: generateId(),
      name,
      duration: isNaN(duration) ? 1 : duration,
      predecessors
    });
  }
  
  return tasks;
}

/**
 * Parse un fichier JSON en liste de tâches
 * @param json Contenu du fichier JSON
 * @returns Liste des tâches
 */
export function parseJSON(json: string): Task[] {
  try {
    const data = JSON.parse(json) as TaskImportFormat;
    
    // Vérifier que le format est correct
    if (!Array.isArray(data.tasks)) {
      throw new Error('Format JSON invalide: "tasks" doit être un tableau');
    }
    
    return data.tasks.map(task => ({
      id: task.id || generateId(),
      name: task.name,
      duration: task.duration,
      predecessors: task.predecessors || []
    }));
  } catch (error) {
    console.error('Erreur lors du parsing JSON:', error);
    return [];
  }
}

/**
 * Exporte les tâches au format JSON
 * @param tasks Liste des tâches
 * @returns Chaîne JSON
 */
export function exportToJSON(tasks: Task[]): string {
  const data: TaskImportFormat = {
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      duration: task.duration,
      predecessors: task.predecessors
    }))
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * Exporte les tâches au format CSV
 * @param tasks Liste des tâches
 * @returns Chaîne CSV
 */
export function exportToCSV(tasks: Task[]): string {
  // En-tête
  const header = 'Nom,Durée,Prédécesseurs\n';
  
  // Lignes
  const lines = tasks.map(task => {
    const predecessors = task.predecessors.join(';');
    return `${task.name},${task.duration},${predecessors}`;
  });
  
  return header + lines.join('\n');
}

/**
 * Formate une durée en jours
 * @param duration Durée en jours
 * @returns Chaîne formatée
 */
export function formatDuration(duration: number): string {
  if (duration === 1) {
    return '1 jour';
  }
  return `${duration} jours`;
}

/**
 * Génère des données d'exemple
 * @returns Liste de tâches d'exemple
 */
export function generateSampleData(): Task[] {
  return [
    { id: 'A', name: 'Analyse des besoins', duration: 5, predecessors: [] },
    { id: 'B', name: 'Conception', duration: 7, predecessors: ['A'] },
    { id: 'C', name: 'Développement du frontend', duration: 10, predecessors: ['B'] },
    { id: 'D', name: 'Développement du backend', duration: 12, predecessors: ['B'] },
    { id: 'E', name: 'Intégration', duration: 6, predecessors: ['C', 'D'] },
    { id: 'F', name: 'Tests', duration: 8, predecessors: ['E'] },
    { id: 'G', name: 'Déploiement', duration: 3, predecessors: ['F'] }
  ];
}