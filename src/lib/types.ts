// Types principaux pour notre application

// Représentation d'une tâche
export interface Task {
  id: string;
  name: string;
  duration: number; // Durée en jours
  predecessors: string[]; // IDs des tâches précédentes
  start?: number; // Date de début (calculée)
  end?: number; // Date de fin (calculée)
  earliestStart?: number; // Début au plus tôt (PERT)
  earliestFinish?: number; // Fin au plus tôt (PERT)
  latestStart?: number; // Début au plus tard (PERT)
  latestFinish?: number; // Fin au plus tard (PERT)
  slack?: number; // Marge (PERT)
  isCritical?: boolean; // Si la tâche est dans le chemin critique
  color?: string; // Couleur pour le diagramme (optionnelle)
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
}

// Format pour l'export des données
export interface DiagramData {
  tasks: Task[];
  criticalPath?: string[]; // Liste des IDs des tâches du chemin critique
  projectDuration?: number; // Durée totale du projet
}