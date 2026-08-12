import { z } from 'zod';

export const studentLearningProfileSchema = z.object({
  user_id: z.string().uuid(),
  concept_mastery: z.record(z.string(), z.number()).optional(),
  skill_mastery: z.record(z.string(), z.number()).optional(),
  avg_solving_time_ms: z.number().int().nonnegative().optional(),
  retry_count: z.number().int().nonnegative().optional(),
  review_history: z.array(z.any()).optional(),
  learning_velocity: z.number().optional(),
  forgetting_rate: z.number().optional(),
  preferred_exercise_type: z.string().optional(),
  preferred_project_difficulty: z.number().int().optional(),
  confidence_score: z.number().optional(),
  weak_concepts: z.array(z.string()).optional(),
  strong_concepts: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const recommendationSchema = z.object({
  user_id: z.string().uuid().optional(),
  type: z.string(),
  payload: z.any().optional(),
  score: z.number().optional(),
});

export const dashboardProjectionSchema = z.object({
  user_id: z.string().uuid(),
  next_missions: z.array(z.any()).optional(),
  recommendations: z.array(z.any()).optional(),
  knowledge_to_review: z.array(z.any()).optional(),
  weak_skills: z.array(z.any()).optional(),
  learning_velocity: z.number().optional(),
  weekly_progress: z.array(z.any()).optional(),
});
