import { z } from 'zod';

export const conceptSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export const skillSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  concept_id: z.string().uuid().optional(),
});

export const experienceSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  interactive_content: z.any().optional(),
  estimated_minutes: z.number().int().positive().optional(),
});

export const projectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  is_boss: z.boolean().optional(),
  required_skills: z.array(z.string()).optional(),
  transversal: z.boolean().optional(),
});

export const exerciseExtendedSchema = z.object({
  experience_id: z.string().uuid().optional(),
  xp_reward: z.number().int().nonnegative().optional(),
  skills_learned: z.array(z.string()).optional(),
  skills_required: z.array(z.string()).optional(),
  skills_reused: z.array(z.string()).optional(),
});

export const missionSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  briefing: z.string().optional(),
  summary: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  exercises: z.array(z.union([z.string(), z.number()])).optional(),
  rewards: z.array(z.any()).optional(),
  difficulty: z.number().int().min(1).optional(),
  estimated_minutes: z.number().int().positive().optional(),
  prerequisites: z.array(z.any()).optional(),
});

export const missionStepSchema = z.object({
  mission_id: z.string().uuid(),
  step_index: z.number().int().nonnegative(),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['experience', 'exercise', 'project']).optional(),
  meta: z.any().optional(),
});

export const missionProgressSchema = z.object({
  user_id: z.string().uuid(),
  mission_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  current_step: z.number().int().nonnegative().optional(),
  progress: z.any().optional(),
});
