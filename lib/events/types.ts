export type UUID = string;

export interface EventEnvelope<T = any> {
  id: UUID;
  name: string;
  version: number;
  timestamp: string; // ISO
  source: string; // service/component that emitted
  userId?: string | null;
  correlationId?: string | null;
  causationId?: string | null;
  payload: T;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: EventEnvelope<T>) => Promise<void> | void;

export type EventRegistration = {
  name: string;
  version: number;
  description?: string;
};

export interface EventResult {
  event: EventEnvelope;
  success: boolean;
  error: any;
  latencyMs: number;
  retryCount: number;
}

export interface EventMetrics {
  published: number;
  processed: number;
  failed: number;
  retries: number;
  latencyMs: number;
}

export const KnownEventNames = [
  'UserRegistered',
  'ProfileUpdated',
  'UsernameChanged',
  'AvatarUpdated',
  'LessonStarted',
  'LessonCompleted',
  'ExerciseStarted',
  'ExerciseSubmitted',
  'ExerciseValidated',
  'ExerciseFailed',
  'ConceptLearned',
  'ConceptForgotten',
  'MissionCreated',
  'MissionStepCreated',
  'MissionStarted',
  'MissionProgressUpdated',
  'MissionUnlocked',
  'MissionCompleted',
  'ModuleUnlocked',
  'ModuleCompleted',
  'ProjectStarted',
  'ProjectCompleted',
  'RecommendationGenerated',
  'RecommendationsUpdated',
  'MemoryUpdated',
  'KnowledgeUpdated',
  'ReviewScheduled',
  'ProgressUpdated',
  'XpAwarded',
  'LevelUp',
  'AchievementUnlocked',
  'DashboardUpdated',
] as const;

export type KnownEventName = typeof KnownEventNames[number];

export interface EventFilter {
  userId?: string;
  name?: string;
  since?: string; // ISO
  until?: string; // ISO
}
