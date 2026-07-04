/**
 * Database types for TrainArduino
 * Generated from migrations.sql schema
 */

// ============================================================================
// PROFILES
// ============================================================================
export interface Profile {
  id: string; // UUID from auth.users
  pseudo: string;
  xp_total: number;
  niveau_actuel: number;
  module_actuel_id: number | null;
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
