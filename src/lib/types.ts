// Types principaux pour notre application

// Représentation d'une tâche
export interface Task {
  id: string;
  name: string;
  duration: number;
  predecessors: string[];
  start?: number;
  end?: number;
  earliestStart?: number;
  earliestFinish?: number;
  latestStart?: number;
  latestFinish?: number;
  slack?: number;
  isCritical?: boolean;
  color?: string;
  level?: number;
}

// Représentation d'un lien entre deux tâches dans le PERT
export interface Link {
  source: string;
  target: string;
  type: string; // Type de lien (fin-début, début-début, etc.)
}

// Type de diagramme
export enum DiagramType {
  GANTT = 'gantt',
  PERT = 'pert',
  BOTH = 'both'
}

// Format d'entrée pour l'import de données
export interface TaskImportFormat {
  tasks: Task[];
}

// Nœud pour le diagramme PERT
export interface PertNode {
  id: string;
  name: string;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
  duration: number;
  x?: number; // Position X (calculée pour le rendu)
  y?: number; // Position Y (calculée pour le rendu)
  level?: number; // ✅ Ajout de la propriété level manquante
}

// Format pour l'export des données
export interface DiagramData {
  tasks: Task[];
  criticalPath?: string[]; // Liste des IDs des tâches du chemin critique
  projectDuration?: number; // Durée totale du projet
}