/**
 * Database utilities for TrainArduino
 * Helper functions to interact with Supabase
 */

import { supabase } from './supabase';
import type {
  Module,
  Lesson,
  Exercise,
  Submission,
  Progress,
  Profile,
  PositioningTestResult,
} from './types';

// ============================================================================
// MODULES
// ============================================================================

export async function getModules() {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch modules: ${error.message}`);
  return data as Module[];
}

export async function getModule(moduleId: number) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) throw new Error(`Failed to fetch module: ${error.message}`);
  return data as Module;
}

// ============================================================================
// LESSONS
// ============================================================================

export async function getLessonsByModule(moduleId: number) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  return data as Lesson[];
}

export async function getLesson(lessonId: number) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (error) throw new Error(`Failed to fetch lesson: ${error.message}`);
  return data as Lesson;
}

// ============================================================================
// EXERCISES
// ============================================================================

export async function getExercisesByModule(moduleId: number) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch exercises: ${error.message}`);
  return data as Exercise[];
}

export async function getExercise(exerciseId: number) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) throw new Error(`Failed to fetch exercise: ${error.message}`);
  return data as Exercise;
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

export async function getUserSubmissions(userId: string) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  return data as Submission[];
}

export async function getUserSubmissionForExercise(
  userId: string,
  exerciseId: number
) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch submission: ${error.message}`);
  }

  return (data as Submission) || null;
}

export async function createSubmission(
  userId: string,
  exerciseId: number,
  codeSoumis: string,
  videoUrl?: string
) {
  // First, get the exercise to know how much XP to reward
  await getExercise(exerciseId);

  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      [
        {
          user_id: userId,
          exercise_id: exerciseId,
          code_soumis: codeSoumis,
          video_url: videoUrl || null,
          statut: 'pending',
          xp_gagne: 0,
        },
      ],
      { onConflict: 'user_id,exercise_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to create submission: ${error.message}`);
  return data as Submission;
}

export async function updateSubmissionStatus(
  submissionId: number,
  status: string,
  feedback?: string,
  xpGained?: number,
  note?: number
) {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      statut: status,
      feedback_ia: feedback || null,
      xp_gagne: xpGained || 0,
      note: note || null,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update submission: ${error.message}`);
  return data as Submission;
}

// ============================================================================
// PROGRESS
// ============================================================================

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch progress: ${error.message}`);
  return data as Progress[];
}

export async function getModuleProgress(userId: string, moduleId: number) {
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch module progress: ${error.message}`);
  }

  return (data as Progress) || null;
}

export async function updateModuleProgress(
  userId: string,
  moduleId: number,
  status: string,
  score: number,
  completedCount: number
) {
  const { data, error } = await supabase
    .from('progress')
    .upsert(
      [
        {
          user_id: userId,
          module_id: moduleId,
          statut: status,
          score,
          exercices_completes: completedCount,
        },
      ],
      { onConflict: 'user_id,module_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to update progress: ${error.message}`);
  return data as Progress;
}

// ============================================================================
// POSITIONING TEST RESULTS
// ============================================================================

export async function getPositioningTestResult(userId: string) {
  const { data, error } = await supabase
    .from('positioning_test_results')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(
      `Failed to fetch test result: ${error.message}`
    );
  }

  return (data as PositioningTestResult) || null;
}

export async function createPositioningTestResult(
  userId: string,
  palierAtteint: number,
  score: number,
  reponsesCorrectes: number,
  totalQuestions: number
) {
  const { data, error } = await supabase
    .from('positioning_test_results')
    .insert([
      {
        user_id: userId,
        palier_atteint: palierAtteint,
        score,
        reponses_correctes: reponsesCorrectes,
        total_questions: totalQuestions,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Failed to save test result: ${error.message}`);
  return data as PositioningTestResult;
}

// ============================================================================
// PROFILES
// ============================================================================

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data as Profile;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return data as Profile;
}

export async function updateUserLevel(userId: string, newLevel: number) {
  return updateUserProfile(userId, {
    niveau_actuel: newLevel,
  });
}

export async function updateUserXP(userId: string, xpToAdd: number) {
  // First get current XP
  const profile = await getUserProfile(userId);
  const newXP = profile.xp_total + xpToAdd;

  // Calculate new level based on XP
  const newLevel = calculateLevelFromXP(newXP);

  return updateUserProfile(userId, {
    xp_total: newXP,
    niveau_actuel: newLevel,
  });
}

export async function updateCurrentModule(userId: string, moduleId: number) {
  return updateUserProfile(userId, {
    module_actuel_id: moduleId,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate level based on XP
 * Adjust these thresholds as needed
 */
function calculateLevelFromXP(xp: number): number {
  if (xp >= 10000) return 10;
  if (xp >= 8000) return 9;
  if (xp >= 6000) return 8;
  if (xp >= 4500) return 7;
  if (xp >= 3000) return 6;
  if (xp >= 2000) return 5;
  if (xp >= 1200) return 4;
  if (xp >= 600) return 3;
  if (xp >= 200) return 2;
  return 1;
}

/**
 * Get total XP earned by user from submissions
 */
export async function calculateUserXP(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('submissions')
    .select('xp_gagne')
    .eq('user_id', userId)
    .eq('statut', 'approved');

  if (error) throw new Error(`Failed to calculate XP: ${error.message}`);

  return data.reduce((total, sub) => total + (sub.xp_gagne || 0), 0);
}

/**
 * Get count of completed exercises for a module
 */
export async function getCompletedExercisesInModule(
  userId: string,
  moduleId: number
): Promise<number> {
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('module_id', moduleId);

  if (exerciseError) {
    throw new Error(`Failed to fetch module exercises: ${exerciseError.message}`);
  }

  const exerciseIds = exerciseData?.map((exercise) => exercise.id) || [];

  const { data, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('statut', 'approved')
    .in('exercise_id', exerciseIds);

  if (error) throw new Error(`Failed to get completed exercises: ${error.message}`);

  return data?.length || 0;
}

/**
 * Unlock next module for user
 */
export async function unlockNextModule(userId: string) {
  // Get user's current level
  const profile = await getUserProfile(userId);

  // Find next locked module that matches user's level
  const { data: modules, error } = await supabase
    .from('modules')
    .select('*')
    .eq('palier_test', profile.niveau_actuel)
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to find next module: ${error.message}`);

  if (modules && modules.length > 0) {
    const nextModule = modules[0];

    // Create progress for this module
    await updateModuleProgress(userId, nextModule.id, 'in_progress', 0, 0);

    return nextModule;
  }

  return null;
}
