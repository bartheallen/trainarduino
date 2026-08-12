import { z } from 'zod';

export const recommendationHistorySchema = z.object({
  user_id: z.string().uuid().optional(),
  recommendation_id: z.string().uuid().optional(),
  type: z.string(),
  payload: z.any().optional(),
  score: z.number().optional(),
  rationale: z.any().optional(),
});

export const recommendationFeedbackSchema = z.object({
  recommendation_history_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  feedback: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});
