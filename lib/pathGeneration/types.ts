/**
 * Phase 1: Dynamic Learning Path Generation
 * Types for learning path, sequencing, and adaptive progression
 */

export type PathNode = {
  conceptId: string;
  conceptKey: string;
  title: string;
  sequenceNumber: number;
  difficulty: number; // 0-100
  estimatedMinutes: number;
  masteryRequired: number; // 0-100 to unlock
  prerequisites: string[]; // conceptIds
  readiness: number; // 0-100
  blockers: string[]; // conceptIds blocking this
  reasons: string[]; // why this node was suggested
};

export type LearningPath = {
  id: string;
  userId: string;
  goal?: string;
  createdAt: string;
  estimatedTotalMinutes: number;
  currentNodeIndex: number;
  nodes: PathNode[];
  metadata: {
    learningStyle?: string;
    difficultyProgression: 'gentle' | 'standard' | 'aggressive';
    preferredSessionLength: number; // minutes
    targetDate?: string;
    confidenceScore: number; // 0-100
  };
};

export type PathGenerationRequest = {
  userId: string;
  targetConcept?: string; // specific goal
  availableMinutes?: number;
  difficultyLevel?: 'easy' | 'normal' | 'hard';
  learningStyle?: string;
  preferReview?: boolean;
  includeProjects?: boolean;
};

export type PathGenerationResult = {
  path: LearningPath;
  alternativePaths?: LearningPath[];
  explanation: string;
  confidence: number; // 0-100
};

export type MilestoneDefinition = {
  id: string;
  conceptId: string;
  milestoneName: string;
  masteryThreshold: number; // 0-100
  successCriteria: string[];
  estimatedDaysToReach: number;
};

export type ProgressEstimate = {
  conceptId: string;
  currentMastery: number;
  predictedMastery7d: number;
  predictedMastery30d: number;
  daysToMastery: number;
  riskOfRegression: number; // 0-100
  recommendedReviewIntervals: number[]; // in days
};

export type DependencyGraph = {
  nodes: Map<string, { concept: any; mastery: number }>;
  edges: Map<string, string[]>; // conceptId -> [prerequisiteIds]
  reverseEdges: Map<string, string[]>; // conceptId -> [dependentIds]
};

export type PathOptimization = {
  originalPath: PathNode[];
  optimizedPath: PathNode[];
  improvements: {
    timeReduced: number; // minutes
    difficultySmoothed: boolean;
    engagementScore: number; // 0-100
    personalizedScore: number; // 0-100
  };
};

export type SequenceConstraint = {
  type: 'prerequisite' | 'difficulty' | 'spacing' | 'style_match' | 'time_budget';
  conceptId: string;
  description: string;
  weight: number; // 0-1
};
