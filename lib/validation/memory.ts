import { z } from 'zod';

export const conceptSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const conceptStateSchema = z.object({
  user_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  state: z.enum(['UNKNOWN','DISCOVERING','UNDERSTOOD','PRACTICING','MASTERED','FORGOTTEN','REVIEW_REQUIRED']).optional(),
  mastery_score: z.number().int().min(0).max(100).optional(),
  retention_score: z.number().optional(),
  last_review: z.string().optional(),
});

export const learningDnaSchema = z.object({
  user_id: z.string().uuid(),
  traits: z.record(z.string(), z.any()).optional(),
});

export const memoryEventSchema = z.object({
  user_id: z.string().uuid().optional(),
  concept_id: z.string().uuid().optional(),
  event_type: z.string(),
  payload: z.any().optional(),
});
