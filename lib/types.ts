/**
 * Database types for TrainArduino
 * Generated from migrations.sql schema
 */

// ============================================================================
// PROFILES
// ============================================================================
export interface Profile {
  id: string; // UUID from auth.users
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  xp_total: number;
  niveau_actuel: number | null;
  module_actuel_id: string | null;
  streak?: number | null;
  last_active_at?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
  achievements?: string[] | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MODULES
// ============================================================================
export interface Module {
  id: number;
  titre: string;
  description: string | null;
  ordre: number;
  palier_test: number;
  is_capstone: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LESSONS
// ============================================================================
export interface Lesson {
  id: number;
  module_id: number;
  titre: string;
  contenu: string;
  image_url?: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXERCISES
// ============================================================================
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: number;
  module_id: number;
  titre: string;
  enonce: string;
  critere_correction: string | null;
  exemple_solution: string | null;
  circuit_instructions?: string | null;
  xp_recompense: number;
  difficulte: ExerciseDifficulty;
  wokwi_project_url: string | null;
  ordre: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUBMISSIONS
// ============================================================================
export type SubmissionStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected';

export interface Submission {
  id: number;
  user_id: string; // UUID
  exercise_id: number;
  code_soumis: string;
  feedback_ia: string | null;
  statut: SubmissionStatus;
  video_url: string | null;
  xp_gagne: number;
  note: number | null; // 0.0 - 1.0
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithExercise extends Submission {
  exercise?: Exercise;
}

// ============================================================================
// PROGRESS
// ============================================================================
export type ProgressStatus =
  | 'locked'
  | 'in_progress'
  | 'completed';

export interface Progress {
  id: number;
  user_id: string; // UUID
  module_id: number;
  statut: ProgressStatus;
  score: number; // percentage 0-100
  exercices_completes: number;
  created_at: string;
  updated_at: string;
}

export interface ProgressWithModule extends Progress {
  module?: Module;
}

export interface Experience {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  interactive_content?: any | null;
  estimated_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export type DashboardProjection = {
  id?: string;
  user_id: string;
  next_missions?: unknown[];
  recommendations?: unknown[];
  knowledge_to_review?: unknown[];
  weak_skills?: string[];
  learning_velocity?: number;
  weekly_progress?: unknown[];
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

export interface Project {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  is_boss?: boolean | null;
  required_skills?: unknown[] | null;
  transversal?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  concept_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  score: number;
  generated_at: string;
  consumed: boolean;
}

export interface RecommendationHistory {
  id: string;
  user_id: string | null;
  recommendation_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  score: number;
  rationale: Record<string, unknown>;
  feedback?: string | null;
  created_at: string;
}

export interface RecommendationFeedback {
  id: string;
  recommendation_history_id: string | null;
  user_id: string | null;
  feedback: string | null;
  rating: number | null;
  created_at: string;
}

export interface RecommendationWeight {
  id: string;
  recommendation_id: string | null;
  concept: string | null;
  value: number;
  updated_at: string;
}

// ============================================================================
// POSITIONING TEST RESULTS
// ============================================================================
export interface PositioningTestResult {
  id: number;
  user_id: string; // UUID
  palier_atteint: number; // Level 1, 2, 3...
  score: number | null; // Percentage
  reponses_correctes: number | null;
  total_questions: number | null;
  created_at: string;
}

// ============================================================================
// COMBINED TYPES
// ============================================================================

export interface UserWithProfile {
  id: string;
  email: string;
  profile: Profile;
}

export interface StudentLearningProfile {
  id?: string;
  user_id: string;
  concept_mastery?: Record<string, number> | null;
  skill_mastery?: Record<string, number> | null;
  avg_solving_time_ms?: number | null;
  retry_count?: number | null;
  review_history?: any[] | null;
  learning_velocity?: number | null;
  forgetting_rate?: number | null;
  preferred_exercise_type?: string | null;
  preferred_project_difficulty?: number | null;
  confidence_score?: number | null;
  weak_concepts?: string[] | null;
  strong_concepts?: string[] | null;
  metadata?: Record<string, any> | null;
  updated_at?: string;
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  briefing?: string | null;
  summary?: string | null;
  concepts?: any[] | null;
  skills?: any[] | null;
  exercises?: any[] | null;
  rewards?: any[] | null;
  difficulty?: number | null;
  estimated_minutes?: number | null;
  prerequisites?: any[] | null;
  unlocked?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MissionStep {
  id: string;
  mission_id: string;
  step_index: number;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  meta?: Record<string, any> | null;
  created_at: string;
}

export interface MissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  status?: string | null;
  current_step?: number | null;
  progress?: Record<string, any> | null;
  rewards_granted?: any[] | null;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
}

export interface ModuleWithContent {
  module: Module;
  lessons: Lesson[];
  exercises: Exercise[];
}

export interface UserProgress {
  profile: Profile;
  progress: ProgressWithModule[];
  totalXP: number;
  completedModules: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SubmitExerciseRequest {
  exercise_id: number;
  code_soumis: string;
  video_url?: string;
}

export interface SubmitExerciseResponse {
  submission_id: number;
  xp_gained: number;
  feedback: string;
  approved: boolean;
}

export interface UpdateProgressRequest {
  module_id: number;
  statut: ProgressStatus;
  score: number;
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Type for database responses
 * Supabase returns data in this format
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
}

/**
 * Type for list responses
 */
export interface SupabaseListResponse<T> {
  data: T[];
  error: SupabaseError | null;
}
