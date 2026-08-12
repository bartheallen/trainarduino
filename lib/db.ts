/**
 * Database utilities for TrainArduino
 * Helper functions to interact with Supabase
 */

import { createServerSupabaseClient } from './supabase/server';
import type {
  Module,
  Lesson,
  Exercise,
  Submission,
  Progress,
  Profile,
  PositioningTestResult,
} from './types';

async function getSupabase() {
  return await createServerSupabaseClient();
}

// ============================================================================
// MODULES
// ============================================================================

export async function getModules() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch modules: ${error.message}`);
  return data as Module[];
}

export async function getModule(moduleId: number) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  return data as Lesson[];
}

export async function getLesson(lessonId: number) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: true });

  if (error) throw new Error(`Failed to fetch exercises: ${error.message}`);
  return data as Exercise[];
}

export async function getExercise(exerciseId: number) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();

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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch progress: ${error.message}`);
  return data as Progress[];
}

export async function getModuleProgress(userId: string, moduleId: number) {
  const supabase = await getSupabase();
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

export async function ensureFirstModuleProgress(userId: string, modules: Module[]) {
  const firstModule = [...modules].sort((a, b) => a.ordre - b.ordre)[0];
  if (!firstModule) {
    return null;
  }

  const existing = await getModuleProgress(userId, firstModule.id).catch(() => null);
  if (existing && existing.statut !== 'locked') {
    return existing;
  }

  return updateModuleProgress(userId, firstModule.id, 'in_progress', 0, 0);
}

export async function updateModuleProgress(
  userId: string,
  moduleId: number,
  status: string,
  score: number,
  completedCount: number
) {
  const supabase = await getSupabase();
  const existing = await getModuleProgress(userId, moduleId).catch(() => null);

  if (existing?.statut === 'completed') {
    return existing;
  }

  const finalStatus = status === 'completed' ? 'completed' : status;
  const finalScore = finalStatus === 'completed' ? 100 : score;

  const { data, error } = await supabase
    .from('progress')
    .upsert(
      [
        {
          user_id: userId,
          module_id: moduleId,
          statut: finalStatus,
          score: finalScore,
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
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
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

export async function upsertPositioningTestResult(
  userId: string,
  palierAtteint: number,
  score: number,
  reponsesCorrectes: number,
  totalQuestions: number
) {
  const existing = await getPositioningTestResult(userId);
  if (!existing) {
    return createPositioningTestResult(userId, palierAtteint, score, reponsesCorrectes, totalQuestions);
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('positioning_test_results')
    .update({ palier_atteint: palierAtteint, score, reponses_correctes: reponsesCorrectes, total_questions: totalQuestions })
    .eq('id', existing.id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update test result: ${error.message}`);
  return data as PositioningTestResult;
}

// ============================================================================
// PROFILES
// ============================================================================

export async function getUserProfile(userId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data as Profile;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();

  const { data: currentProfile, error: currentError } = await supabase
    .from('profiles')
    .select('xp_total, niveau_actuel')
    .eq('id', userId)
    .single();

  if (currentError) {
    throw new Error(`Failed to load user profile for XP update: ${currentError.message}`);
  }

  const currentXp = Number(currentProfile?.xp_total ?? 0);
  const nextXpTotal = Math.max(0, currentXp + Number(xpToAdd ?? 0));

  const { data, error } = await supabase
    .from('profiles')
    .update({ xp_total: nextXpTotal })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user XP: ${error.message}`);
  }

  const updatedProfile = data as Profile;
  const newLevel = calculateLevelFromXP(updatedProfile.xp_total);

  if (updatedProfile.niveau_actuel !== newLevel) {
    return updateUserProfile(userId, {
      niveau_actuel: newLevel,
    });
  }

  return updatedProfile;
}

export async function updateCurrentModule(userId: string, moduleId: number) {
  return updateUserProfile(userId, {
    module_actuel_id: String(moduleId),
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const LEVEL_THRESHOLDS = [0, 200, 600, 1200, 2000, 3000, 4500, 6000, 8000, 10000];

export function getLevelThresholds(xp: number) {
  const level = calculateLevelFromXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold;
  return {
    currentLevel: level,
    currentThreshold,
    nextThreshold,
    xpToNextLevel: Math.max(0, nextThreshold - xp),
  };
}

function calculateLevelFromXP(xp: number): number {
  for (let index = LEVEL_THRESHOLDS.length - 1; index >= 0; index -= 1) {
    if (xp >= LEVEL_THRESHOLDS[index]) {
      return index + 1;
    }
  }
  return 1;
}

function getCalendarPartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour ?? 0),
    minute: Number(values.minute ?? 0),
    second: Number(values.second ?? 0),
  };
}

function getDayStartInTimeZone(date: Date, timeZone: string) {
  const { year, month, day } = getCalendarPartsInTimeZone(date, timeZone);
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

export function resolveUserTimeZone(profile?: Partial<Profile> | null) {
  if (profile?.timezone && typeof profile.timezone === 'string' && profile.timezone.trim().length > 0) {
    return profile.timezone;
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function calculateNextStreak(currentStreak: number, lastActiveAt?: string | null, activityAt?: string | null, timeZone?: string | null) {
  const resolvedTimeZone = timeZone || 'UTC';
  const now = activityAt ? new Date(activityAt) : new Date();

  if (!lastActiveAt) {
    return 1;
  }

  const lastActiveDate = new Date(lastActiveAt);
  const lastDay = getDayStartInTimeZone(lastActiveDate, resolvedTimeZone);
  const nowDay = getDayStartInTimeZone(now, resolvedTimeZone);
  const dayDiff = Math.round((nowDay - lastDay) / 86_400_000);

  if (dayDiff <= 0) {
    return currentStreak > 0 ? currentStreak : 1;
  }

  if (dayDiff === 1) {
    return currentStreak + 1;
  }

  return 1;
}

export async function updateUserStreak(userId: string, activityAt?: string) {
  const profile = await getUserProfile(userId);
  const now = activityAt ? new Date(activityAt) : new Date();
  const currentStreak = profile.streak ?? 0;
  const userTimeZone = resolveUserTimeZone(profile);
  const nextStreak = calculateNextStreak(currentStreak, profile.last_active_at, now.toISOString(), userTimeZone);

  return updateUserProfile(userId, {
    streak: nextStreak,
    last_active_at: now.toISOString(),
  } as Partial<Profile>);
}

/**
 * Get total XP earned by user from submissions
 */
export async function calculateUserXP(userId: string): Promise<number> {
  const supabase = await getSupabase();
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
export interface ModuleProgressMetrics {
  totalLessons: number;
  totalExercises: number;
  completedLessons: number;
  completedExercises: number;
  totalItems: number;
  completedItems: number;
}

export interface ModuleLessonProgressMetrics {
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  allLessonsCompleted: boolean;
}

export async function getModuleLessonProgressMetrics(
  userId: string,
  moduleId: number
): Promise<ModuleLessonProgressMetrics> {
  const supabase = await getSupabase();

  const [lessonsResult, completedLessonsResult] = await Promise.all([
    supabase.from('lessons').select('id').eq('module_id', moduleId),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('completed', true),
  ]);

  if (lessonsResult.error) throw new Error(`Failed to fetch module lessons: ${lessonsResult.error.message}`);
  if (completedLessonsResult.error) throw new Error(`Failed to fetch completed lesson progress: ${completedLessonsResult.error.message}`);

  const totalLessons = lessonsResult.data?.length || 0;
  const completedLessons = completedLessonsResult.count || 0;
  const allLessonsCompleted = totalLessons > 0 && completedLessons >= totalLessons;
  const completionPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    totalLessons,
    completedLessons,
    completionPercent,
    allLessonsCompleted,
  };
}

export async function getCompletedExercisesInModule(
  userId: string,
  moduleId: number
): Promise<number> {
  const supabase = await getSupabase();
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('module_id', moduleId);

  if (exerciseError) {
    throw new Error(`Failed to fetch module exercises: ${exerciseError.message}`);
  }

  const exerciseIds = exerciseData?.map((exercise) => exercise.id) || [];

  if (exerciseIds.length === 0) {
    return 0;
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('statut', 'approved')
    .in('exercise_id', exerciseIds);

  if (error) throw new Error(`Failed to get completed exercises: ${error.message}`);

  return data?.length || 0;
}

export async function moduleHasPracticalTest(moduleId: number): Promise<boolean> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('module_id', moduleId)
    .or('wokwi_project_url.is.not.null,circuit_instructions.is.not.null')
    .limit(1);

  if (error) {
    throw new Error(`Failed to check practical test requirement: ${error.message}`);
  }

  return (data?.length ?? 0) > 0;
}

export async function hasApprovedPracticalSubmissionForModule(
  userId: string,
  moduleId: number
): Promise<boolean> {
  const supabase = await getSupabase();
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id')
    .eq('module_id', moduleId)
    .or('wokwi_project_url.is.not.null,circuit_instructions.is.not.null');

  if (exercisesError) {
    throw new Error(`Failed to fetch practical exercises: ${exercisesError.message}`);
  }

  const exerciseIds = (exercises ?? []).map((exercise: { id: number }) => exercise.id);
  if (exerciseIds.length === 0) {
    return false;
  }

  const { count, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('statut', 'approved')
    .in('exercise_id', exerciseIds);

  if (error) {
    throw new Error(`Failed to fetch approved practical submissions: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function getModuleProgressMetrics(
  userId: string,
  moduleId: number
): Promise<ModuleProgressMetrics> {
  const supabase = await getSupabase();

  const [lessonsResult, exercisesResult, completedLessonsResult] = await Promise.all([
    supabase.from('lessons').select('id').eq('module_id', moduleId),
    supabase.from('exercises').select('id').eq('module_id', moduleId),
    supabase
      .from('lesson_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('completed', true),
  ]);

  if (lessonsResult.error) throw new Error(`Failed to fetch module lessons: ${lessonsResult.error.message}`);
  if (exercisesResult.error) throw new Error(`Failed to fetch module exercises: ${exercisesResult.error.message}`);
  if (completedLessonsResult.error) throw new Error(`Failed to fetch completed lesson progress: ${completedLessonsResult.error.message}`);

  const totalLessons = lessonsResult.data?.length || 0;
  const totalExercises = exercisesResult.data?.length || 0;
  const completedLessons = completedLessonsResult.count || 0;
  const completedExercises = await getCompletedExercisesInModule(userId, moduleId);
  const totalItems = totalLessons + totalExercises;
  const completedItems = completedLessons + completedExercises;

  return {
    totalLessons,
    totalExercises,
    completedLessons,
    completedExercises,
    totalItems,
    completedItems,
  };
}

/**
 * Unlock next module for user
 */
export async function unlockNextModule(userId: string) {
  const supabase = await getSupabase();

  const [{ data: modules, error: modulesError }, { data: progressRows, error: progressError }] = await Promise.all([
    supabase.from('modules').select('*').order('ordre', { ascending: true }),
    supabase.from('progress').select('module_id,statut').eq('user_id', userId),
  ]);

  if (modulesError) throw new Error(`Failed to fetch modules: ${modulesError.message}`);
  if (progressError) throw new Error(`Failed to fetch progress: ${progressError.message}`);

  const progressByModuleId = new Map((progressRows ?? []).map((progress) => [progress.module_id, progress]));
  const hasInProgress = Array.from(progressByModuleId.values()).some((progress) => progress.statut === 'in_progress');
  if (hasInProgress) {
    return null;
  }

  const nextModule = (modules ?? []).find((module, index) => {
    const progress = progressByModuleId.get(module.id);
    if (progress && progress.statut !== 'locked') {
      return false;
    }

    if (index === 0) {
      return true;
    }

    const previousModule = modules?.[index - 1];
    const previousProgress = previousModule ? progressByModuleId.get(previousModule.id) : undefined;
    return previousProgress?.statut === 'completed';
  });

  if (!nextModule) {
    return null;
  }

  await updateModuleProgress(userId, nextModule.id, 'in_progress', 0, 0);
  return nextModule;
}
