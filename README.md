# Visualisateur de diagrammes GANTT & PERT

Une application web moderne permettant de créer et visualiser des diagrammes de GANTT et PERT à partir d'un tableau de tâches. Cette application est développée avec Next.js, React, TypeScript et Tailwind CSS.

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Utilisation](#utilisation)
  - [Création de tâches](#création-de-tâches)
  - [Importation de données](#importation-de-données)
  - [Visualisation des diagrammes](#visualisation-des-diagrammes)
  - [Exportation des données](#exportation-des-données)
- [Structure du projet](#structure-du-projet)
- [Calculs clés](#calculs-clés)
- [Technologies utilisées](#technologies-utilisées)
- [Licence](#licence)

## Présentation

Cette application permet de créer et visualiser des diagrammes de GANTT et de PERT, deux outils essentiels pour la planification et la gestion de projets. L'utilisateur peut entrer manuellement les tâches d'un projet, leurs durées et leurs dépendances, ou importer ces données depuis un fichier CSV ou JSON. L'application génère ensuite des visualisations interactives qui aident à comprendre la structure du projet, le chemin critique et les dépendances entre les tâches.

## Fonctionnalités

- **Création intuitive de tâches** : Interface conviviale pour définir les tâches, leurs durées et leurs dépendances
- **Diagramme de GANTT** : Visualisation temporelle des tâches avec leurs dates de début et de fin
- **Diagramme de PERT** : Visualisation des dépendances entre les tâches et du chemin critique
- **Calcul automatique du chemin critique** : Identification des tâches critiques qui affectent directement la durée totale du projet
- **Import/Export de données** : Support des formats CSV et JSON pour l'importation et l'exportation des données de tâches
- **Design responsive** : Interface adaptée à tous les appareils, du mobile au desktop
- **Interaction avancée** : Survol et clic sur les tâches pour afficher plus de détails

## Installation

Pour installer et exécuter cette application localement, suivez ces étapes :

```bash
# Cloner le dépôt
git clone https://github.com/votre-nom/gantt-pert-visualizer.git
cd gantt-pert-visualizer

# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev
```

L'application sera alors accessible à l'adresse [http://localhost:3000](http://localhost:3000).

Pour créer une version de production :

```bash
npm run build
npm start
```

## Utilisation

### Création de tâches

1. Sur la page d'accueil, cliquez sur "Créer des tâches manuellement"
2. Pour chaque tâche, renseignez :
   - Un nom descriptif
   - La durée en jours
   - Les tâches précédentes (prédécesseurs)
3. Utilisez le bouton "Ajouter une tâche" pour ajouter des tâches supplémentaires
4. Sélectionnez le type de diagramme que vous souhaitez générer (GANTT, PERT ou les deux)
5. Cliquez sur "Générer le diagramme" pour visualiser les résultats

### Importation de données

1. Sur la page d'accueil, cliquez sur "Importer des tâches"
2. Choisissez le format d'importation (CSV ou JSON)
3. Sélectionnez ou glissez-déposez votre fichier
4. L'application chargera les tâches et vous permettra de les modifier avant de générer les diagrammes

#### Format CSV attendu

```
Nom,Durée,Prédécesseurs
Tâche 1,5,
Tâche 2,3,Tâche 1
Tâche 3,7,"Tâche 1;Tâche 2"
```

#### Format JSON attendu

```json
{
  "tasks": [
    {
      "id": "A",
      "name": "Tâche 1",
      "duration": 5,
      "predecessors": []
    },
    {
      "id": "B",
      "name": "Tâche 2",
      "duration": 3,
      "predecessors": ["A"]
    }
  ]
}
```

### Visualisation des diagrammes

Une fois les diagrammes générés, vous pouvez :

- Basculer entre les diagrammes de GANTT et de PERT via les onglets
- Survoler une tâche pour voir ses détails dans une infobulle
- Cliquer sur une tâche pour afficher ses informations complètes dans le panneau latéral
- Observer le chemin critique (en rouge) pour identifier les tâches qui impactent directement la durée du projet
- Consulter les statistiques du projet dans le panneau d'informations

### Exportation des données

1. Dans la page de résultats, cliquez sur le bouton "Exporter"
2. Choisissez le format d'exportation (CSV ou JSON)
3. Le fichier sera automatiquement téléchargé

## Structure du projet

```
gantt-pert-visualizer/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Page principale
│   │   ├── layout.tsx          # Layout de l'application
│   │   ├── globals.css         # Styles globaux
│   ├── components/
│   │   ├── ui/                 # Composants d'UI réutilisables
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Tabs.tsx
│   │   ├── forms/              # Composants de formulaires
│   │   │   ├── TaskForm.tsx
│   │   │   └── ImportForm.tsx
│   │   ├── diagrams/           # Composants de diagrammes
│   │   │   ├── GanttChart.tsx
│   │   │   ├── PertChart.tsx
│   │   │   ├── ProjectInfo.tsx
│   │   │   └── DiagramResult.tsx
│   ├── lib/
│   │   ├── types.ts            # Types et interfaces
│   │   ├── utils.ts            # Fonctions utilitaires
│   │   ├── gantt.ts            # Logique du diagramme de GANTT
│   │   └── pert.ts             # Logique du diagramme de PERT
└── public/                     # Fichiers statiques
```

## Calculs clés

### Diagramme de GANTT

1. **Tri topologique** : Les tâches sont triées en fonction de leurs dépendances pour garantir qu'une tâche ne soit traitée qu'après ses prédécesseurs.
2. **Calcul des dates de début et de fin** : Pour chaque tâche, la date de début est le maximum des dates de fin de ses prédécesseurs, et la date de fin est sa date de début plus sa durée.
3. **Identification du chemin critique** : Le chemin le plus long du projet, qui détermine sa durée totale. Toute tâche sur ce chemin est critique, car tout retard l'affectant retardera l'ensemble du projet.

### Diagramme de PERT

1. **Calcul des dates au plus tôt** :
   - Début au plus tôt (ES) : La date la plus tôt à laquelle une tâche peut commencer
   - Fin au plus tôt (EF) : ES + durée de la tâche
2. **Calcul des dates au plus tard** :
   - Fin au plus tard (LF) : La date la plus tard à laquelle une tâche peut finir sans retarder le projet
   - Début au plus tard (LS) : LF - durée de la tâche
3. **Calcul des marges** : LS - ES, représente le temps dont une tâche peut être retardée sans affecter la durée totale du projet
4. **Identification du chemin critique** : Tâches avec une marge nulle

## Technologies utilisées

- **Next.js** : Framework React pour le rendu côté serveur et la génération de sites statiques
- **React** : Bibliothèque JavaScript pour construire des interfaces utilisateur
- **TypeScript** : Superset typé de JavaScript pour améliorer la qualité du code
- **Tailwind CSS** : Framework CSS utilitaire pour un développement rapide
- **D3.js** : Bibliothèque de visualisation de données pour la création des diagrammes
- **dayjs** : Bibliothèque légère pour la manipulation des dates

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.