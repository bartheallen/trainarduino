export type SessionOptions = {
  goal?: string;
  timeAvailableMinutes?: number;
};

export type LearningSession = {
  id: string;
  userId: string;
  startedAt: string;
  lastActivityAt?: string;
  goal?: string;
  timeAvailableMinutes?: number;
  fatigueEstimate?: number; // 0-100
  context?: any;
};

export type ProgressSnapshot = {
  userId: string;
  generatedAt: string;
  masteryPercent: number;
  knowledgeHealth: number;
  xpTotal: number;
  level?: number;
  weakConcepts: string[];
  strongConcepts: string[];
  reviewQueue: Array<{ conceptId: string; urgency: number }>;
  currentMission?: any;
  currentLesson?: any;
  currentProject?: any;
  learningDNA?: Record<string, any>;
};

export type Explanation = {
  kind: string;
  message: string;
  details?: any;
};
