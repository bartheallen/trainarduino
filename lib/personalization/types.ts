export type PersonalizationContentType = 'review' | 'exercise' | 'challenge' | 'project';

export interface PersonalizationRequest {
  userId: string;
  targetConcept?: string;
  availableMinutes?: number;
  difficultyLevel?: 'easy' | 'normal' | 'hard';
  learningStyle?: string;
  preferReview?: boolean;
  includeProjects?: boolean;
}

export interface PersonalizedContent {
  id: string;
  type: PersonalizationContentType;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: number;
  concepts: string[];
}

export interface PersonalizationPlan {
  userId: string;
  targetConcept?: string;
  estimatedMinutes: number;
  content: PersonalizedContent[];
  rationale: string[];
}
