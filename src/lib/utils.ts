// src/lib/utils.ts - FONCTIONS UTILITAIRES COMPLÈTES

import { Task } from './types';

/**
 * Parser un fichier JSON de tâches
 */
export function parseJSON(jsonContent: string): Task[] {
  try {
    const data = JSON.parse(jsonContent);

    // Vérifier le format
    if (data.tasks && Array.isArray(data.tasks)) {
      return sanitizeTasks(data.tasks);
    } else if (Array.isArray(data)) {
      return sanitizeTasks(data);
    } else {
      throw new Error('Format JSON invalide - doit contenir un tableau de tâches');
    }
  } catch (error) {
    throw new Error(`Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Format invalide'}`);
  }
}

/**
 * Générer des données d'exemple pour les tests
 */
export function generateSampleData(): Task[] {
  return [
    { "id": "A", "name": "Analyse des besoins", "duration": 5, "predecessors": [] },
    { "id": "B", "name": "Conception", "duration": 7, "predecessors": ["A"] },
    { "id": "C", "name": "Développement du frontend", "duration": 10, "predecessors": ["B"] },
    { "id": "D", "name": "Développement du backend", "duration": 12, "predecessors": ["B"] },
    { "id": "E", "name": "Intégration", "duration": 6, "predecessors": ["C", "D"] },
    { "id": "F", "name": "Tests", "duration": 8, "predecessors": ["E"] },
    { "id": "G", "name": "Déploiement", "duration": 3, "predecessors": ["F"] }
  ];
}

/**
 * Générer un ID unique pour une tâche
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Générer un ID intelligent pour une nouvelle tâche
 */
export function generateTaskId(existingTasks: Task[]): string {
  const existingIds = existingTasks.map(t => t.id);

  // Essayer d'abord les lettres A-Z
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode(65 + i); // A, B, C...
    if (!existingIds.includes(id)) return id;
  }

  // Puis les combinaisons AA, AB, etc.
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const id = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
      if (!existingIds.includes(id)) return id;
    }
  }

  // Fallback numérique
  let counter = 1;
  while (existingIds.includes(`T${counter}`)) {
    counter++;
  }
  return `T${counter}`;
}

/**
 * Formater une durée en jours de façon lisible
 */
export function formatDuration(duration: number): string {
  if (duration === 1) {
    return '1 jour';
  }
  return `${duration} jours`;
}

/**
 * Formater une date de projet (jour X)
 */
export function formatProjectDate(day: number): string {
  return `Jour ${day}`;
}

/**
 * Valider les données de tâches
 */
export function validateTasks(tasks: Task[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const taskIds = new Set<string>();

  // Vérifications de base
  if (!Array.isArray(tasks)) {
    errors.push('Les tâches doivent être un tableau');
    return { valid: false, errors };
  }

  if (tasks.length === 0) {
    errors.push('Au moins une tâche est requise');
    return { valid: false, errors };
  }

  tasks.forEach((task, index) => {
    // Vérification de la structure
    if (!task.id || typeof task.id !== 'string') {
      errors.push(`Tâche ${index + 1}: ID manquant ou invalide`);
    } else if (taskIds.has(task.id)) {
      errors.push(`Tâche ${task.id}: ID dupliqué`);
    } else {
      taskIds.add(task.id);
    }

    if (!task.name || typeof task.name !== 'string') {
      errors.push(`Tâche ${task.id || index + 1}: Nom manquant ou invalide`);
    }

    if (typeof task.duration !== 'number' || task.duration <= 0) {
      errors.push(`Tâche ${task.id || index + 1}: Durée invalide (doit être > 0)`);
    }

    if (!Array.isArray(task.predecessors)) {
      errors.push(`Tâche ${task.id || index + 1}: Prédécesseurs doivent être un tableau`);
    }
  });

  // Vérification des dépendances
  tasks.forEach(task => {
    if (task.predecessors) {
      task.predecessors.forEach(predId => {
        if (!taskIds.has(predId)) {
          errors.push(`Tâche ${task.id}: Prédécesseur "${predId}" inexistant`);
        }
        if (predId === task.id) {
          errors.push(`Tâche ${task.id}: Ne peut pas être son propre prédécesseur`);
        }
      });
    }
  });

  // Détection de cycles
  if (errors.length === 0) {
    const cycleError = detectCycles(tasks);
    if (cycleError) {
      errors.push(cycleError);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Détecter les cycles dans les dépendances
 */
function detectCycles(tasks: Task[]): string | null {
  const taskMap = new Map<string, Task>();
  const visited = new Set<string>();
  const recStack = new Set<string>();

  tasks.forEach(task => taskMap.set(task.id, task));

  function hasCycle(taskId: string): boolean {
    if (recStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;

    visited.add(taskId);
    recStack.add(taskId);

    const task = taskMap.get(taskId);
    if (task) {
      for (const predId of task.predecessors) {
        if (hasCycle(predId)) return true;
      }
    }

    recStack.delete(taskId);
    return false;
  }

  for (const task of tasks) {
    if (hasCycle(task.id)) {
      return 'Cycle détecté dans les dépendances des tâches';
    }
  }

  return null;
}

/**
 * Exporter les tâches en JSON
 */
export function exportToJSON(tasks: Task[]): string {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      duration: task.duration,
      predecessors: task.predecessors,
      start: task.start,
      end: task.end,
      isCritical: task.isCritical,
      slack: task.slack
    }))
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Exporter les tâches en CSV
 */
export function exportToCSV(tasks: Task[]): string {
  const headers = [
    'ID',
    'Nom',
    'Durée',
    'Prédécesseurs',
    'Début',
    'Fin',
    'Critique',
    'Marge'
  ];

  const rows = tasks.map(task => [
    task.id,
    `"${task.name.replace(/"/g, '""')}"`, // Échapper les guillemets
    task.duration.toString(),
    `"${task.predecessors.join(', ')}"`,
    (task.start || 0).toString(),
    (task.end || 0).toString(),
    task.isCritical ? 'Oui' : 'Non',
    (task.slack || 0).toString()
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Parser un fichier CSV de tâches
 */
export function parseCSV(csvContent: string): Task[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('Fichier CSV invalide');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const tasks: Task[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length < 4) continue; // Ligne invalide

    const task: Task = {
      id: values[0] || `task_${i}`,
      name: values[1] || `Tâche ${i}`,
      duration: parseInt(values[2]) || 1,
      predecessors: values[3] ? values[3].split(',').map(p => p.trim()).filter(p => p) : []
    };

    tasks.push(task);
  }

  return tasks;
}

/**
 * Parser une ligne CSV (gère les guillemets)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(v => v.replace(/^"(.*)"$/, '$1')); // Retirer les guillemets
}

/**
 * Générer des couleurs distinctes pour les tâches
 */
export function generateTaskColors(taskCount: number): string[] {
  const baseColors = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ];

  const colors: string[] = [];
  for (let i = 0; i < taskCount; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}

/**
 * Calculer les statistiques du projet
 */
export function calculateProjectStats(tasks: Task[]) {
  const totalTasks = tasks.length;
  const criticalTasks = tasks.filter(t => t.isCritical).length;
  const projectDuration = Math.max(...tasks.map(t => t.end || 0));
  const totalWorkDays = tasks.reduce((sum, task) => sum + task.duration, 0);

  const avgTaskDuration = totalWorkDays / totalTasks;
  const criticalPathPercentage = (criticalTasks / totalTasks) * 100;

  return {
    totalTasks,
    criticalTasks,
    projectDuration,
    totalWorkDays,
    avgTaskDuration: Math.round(avgTaskDuration * 10) / 10,
    criticalPathPercentage: Math.round(criticalPathPercentage)
  };
}

/**
 * Trouver les tâches parallèles (qui peuvent être exécutées en même temps)
 */
export function findParallelTasks(tasks: Task[]): Task[][] {
  const parallelGroups: Task[][] = [];
  const timeSlots = new Map<number, Task[]>();

  // Grouper les tâches par heure de début
  tasks.forEach(task => {
    const startTime = task.start || 0;
    if (!timeSlots.has(startTime)) {
      timeSlots.set(startTime, []);
    }
    timeSlots.get(startTime)?.push(task);
  });

  // Convertir en groupes
  timeSlots.forEach(tasksAtTime => {
    if (tasksAtTime.length > 1) {
      parallelGroups.push(tasksAtTime);
    }
  });

  return parallelGroups;
}

/**
 * Nettoyer et formater les données d'entrée
 */
export function sanitizeTasks(tasks: any[]): Task[] {
  return tasks.map((task, index) => ({
    id: String(task.id || `task_${index + 1}`).trim(),
    name: String(task.name || `Tâche ${index + 1}`).trim(),
    duration: Math.max(1, Number(task.duration) || 1),
    predecessors: Array.isArray(task.predecessors)
        ? task.predecessors.map((p: any) => String(p).trim()).filter(Boolean)
        : []
  }));
}