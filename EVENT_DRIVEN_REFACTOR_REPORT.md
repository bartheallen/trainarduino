# Event Driven Refactor Report

## Architecture avant

Avant la refactorisation, la logique Event Driven était centralisée dans un seul handler : `lib/services/learningEventHandlers.ts`.
Ce fichier gérait :
- la mise à jour de l'XP utilisateur,
- le suivi de l'état de progression des modules,
- la mise à jour de la mémoire et de la maîtrise des concepts,
- la génération de recommandations,
- la mise à jour du dashboard,
- les récompenses et achievements.

Cela créait un God Handler central, avec des responsabilités croisées entre plusieurs domaines.

## Architecture après

La logique est désormais découpée en subscribers par domaine :
- `lib/events/subscribers/learningSubscriber.ts`
- `lib/events/subscribers/progressSubscriber.ts`
- `lib/events/subscribers/memorySubscriber.ts`
- `lib/events/subscribers/recommendationSubscriber.ts`
- `lib/events/subscribers/gamificationSubscriber.ts`
- `lib/events/subscribers/dashboardSubscriber.ts`
- `lib/events/subscribers/analyticsSubscriber.ts`

Chaque subscriber s'abonne uniquement aux événements de son domaine et publie ensuite des événements spécifiques.

## Responsabilités de chaque Subscriber

### LearningSubscriber
- écoute : `ExerciseStarted`, `ExerciseSubmitted`, `LessonStarted`, `LessonCompleted`, `ProjectStarted`, `ProjectCompleted`
- responsabilité : tracking d’événements d’apprentissage
- aucune logique métier supplémentaire

### ProgressSubscriber
- écoute : `ExerciseValidated`, `LessonCompleted`, `ProjectCompleted`
- responsabilité : mise à jour de la progression module / leçon / projet
- publie : `ProgressUpdated`, `ModuleCompleted`, `ModuleUnlocked`

### MemorySubscriber
- écoute : `ExerciseValidated`, `ProgressUpdated`
- responsabilité : mise à jour de la mémoire, maîtrises, oubli et ADN d’apprentissage
- publie : `KnowledgeUpdated`, `ReviewScheduled`

### RecommendationSubscriber
- écoute : `KnowledgeUpdated`, `ReviewScheduled`
- responsabilité : génération de recommandations
- publie : `RecommendationsUpdated`

### GamificationSubscriber
- écoute : `ProgressUpdated`, `RecommendationsUpdated`
- responsabilité : mise à jour des XP, niveaux, streaks, achievements
- publie : `XpAwarded`, `LevelUp`, `AchievementUnlocked`

### DashboardSubscriber
- écoute : `XpAwarded`, `KnowledgeUpdated`, `RecommendationsUpdated`, `AchievementUnlocked`, `ReviewScheduled`
- responsabilité : mise à jour de la projection du dashboard
- publie : `DashboardUpdated`

### AnalyticsSubscriber
- écoute : tous les événements
- responsabilité : collecte de métriques évènementielles
- ne modifie rien

## Dépendances supprimées

- suppression de la logique métier centralisée dans `lib/services/learningEventHandlers.ts`.
- suppression des appels directs entre subscribers.
- séparation stricte des domaines par EventBus uniquement.

## Diagramme

```text
User actions --> Learning domain events
  ExerciseStarted, ExerciseSubmitted, LessonStarted, LessonCompleted, ProjectStarted, ProjectCompleted

ExerciseValidated --> ProgressSubscriber --> ProgressUpdated, ModuleCompleted, ModuleUnlocked

ProgressUpdated --> MemorySubscriber --> KnowledgeUpdated, ReviewScheduled

KnowledgeUpdated/ReviewScheduled --> RecommendationSubscriber --> RecommendationsUpdated

ProgressUpdated/RecommendationsUpdated --> GamificationSubscriber --> XpAwarded, LevelUp, AchievementUnlocked

XpAwarded/KnowledgeUpdated/RecommendationsUpdated/AchievementUnlocked/ReviewScheduled --> DashboardSubscriber --> DashboardUpdated

Tous les événements --> AnalyticsSubscriber
```

## Améliorations obtenues

- meilleure séparation des responsabilités
- plus de respect du contrat de domaine
- réduction de l'accouplement entre domaines
- évolution plus simple et tests plus ciblés
- communication uniquement via EventBus

---

*Note : `learningEventHandlers.ts` doit être vidé puis supprimé si aucune logique métier reste.*
