export type KnowledgeConcept = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ConceptDependency = {
  id?: string;
  concept_id: string;
  prerequisite_id: string;
};

export type ConceptStateRow = {
  id: string;
  user_id: string;
  concept_id: string;
  state: 'UNKNOWN'|'DISCOVERING'|'UNDERSTOOD'|'PRACTICING'|'MASTERED'|'FORGOTTEN'|'REVIEW_REQUIRED';
  mastery_score: number;
  retention_score: number;
  last_review?: string | null;
  predicted_forget_date?: string | null;
  review_urgency?: number;
  attempts?: number;
  successful_attempts?: number;
  created_at?: string;
  updated_at?: string;
};

export type MasteryHistory = {
  id?: string;
  user_id: string;
  concept_id: string;
  mastery_score: number;
  retention_score: number;
  source?: string;
  created_at?: string;
};

export type LearningDNA = {
  id?: string;
  user_id: string;
  traits: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type MemoryEvent = {
  id?: string;
  user_id?: string | null;
  concept_id?: string | null;
  event_type: string;
  payload?: any;
  created_at?: string;
};

export type LearningMemoryRecordRow = {
  id: string;
  user_id: string;
  exercise_id?: number | null;
  submission_id?: number | null;
  record_type: string;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
};

export type DashboardProjection = {
  id?: string;
  user_id: string;
  knowledge_health?: number;
  mastery_percent?: number;
  weak_concepts?: any[];
  strong_concepts?: any[];
  todays_reviews?: any[];
  upcoming_reviews?: any[];
  heatmap?: Record<string, any>;
  learning_dna?: Record<string, any>;
  updated_at?: string;
};
