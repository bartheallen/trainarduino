'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Lesson, Module } from '@/lib/types';
import { unlockNextModule, updateModuleProgress, updateCurrentModule, getModuleProgressMetrics, getModuleLessonProgressMetrics } from '@/lib/db';

export interface LessonProgressSnapshot {
  lessonId: number;
  moduleId: number;
  completed: boolean;
  progressPercent: number;
  updatedAt: string;
}

export interface ModuleLearningSummary {
  module: Module;
  lessons: Lesson[];
  completedLessons: number;
  completionPercent: number;
  lastLessonId: number | null;
}

export async function saveLessonProgressAction(
  userId: string,
  moduleId: number,
  lessonId: number,
  progressPercent: number,
  completed: boolean
) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      lesson_id: lessonId,
      progress_percent: progressPercent,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id,lesson_id' }
  );

  if (error) {
    throw new Error(`Failed to save lesson progress: ${error.message}`);
  }

  const lessonMetrics = await getModuleLessonProgressMetrics(userId, moduleId);
  const progressMetrics = await getModuleProgressMetrics(userId, moduleId);
  const status = lessonMetrics.allLessonsCompleted ? 'completed' : 'in_progress';
  const score = lessonMetrics.allLessonsCompleted ? 100 : lessonMetrics.completionPercent;

  await updateModuleProgress(userId, moduleId, status, score, progressMetrics.completedExercises);
  await updateCurrentModule(userId, moduleId);

  if (status === 'completed') {
    await unlockNextModule(userId).catch(() => null);
  }
}

export async function getLessonProgress(userId: string, moduleId: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load lesson progress: ${error.message}`);
  }

  return (data ?? []) as LessonProgressSnapshot[];
}

export interface SocraticCompletionResult {
  success: boolean;
  lessonId?: number;
  error?: string;
}

export async function markSocraticCompletionAction(userId: string, moduleId: number): Promise<SocraticCompletionResult | null> {
  const supabase = await createServerSupabaseClient();

  const { data: firstLesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', moduleId)
    .order('ordre', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lessonError) {
    throw new Error(`Failed to resolve a lesson for module ${moduleId}: ${lessonError.message}`);
  }

  if (!firstLesson?.id) {
    return null;
  }

  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      module_id: moduleId,
      lesson_id: firstLesson.id,
      progress_percent: 100,
      completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id,lesson_id' }
  );

  if (error) {
    console.error(`[learning-progress] Failed to save module progress for user ${userId}, module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }

  const lessonMetrics = await getModuleLessonProgressMetrics(userId, moduleId);
  const progressMetrics = await getModuleProgressMetrics(userId, moduleId);
  const status = lessonMetrics.allLessonsCompleted ? 'completed' : 'in_progress';
  const score = lessonMetrics.allLessonsCompleted ? 100 : lessonMetrics.completionPercent;

  await updateModuleProgress(userId, moduleId, status, score, progressMetrics.completedExercises);
  await updateCurrentModule(userId, moduleId);

  if (status === 'completed') {
    await unlockNextModule(userId).catch(() => null);
  }

  return { success: true, lessonId: firstLesson.id };
}

export async function getUserModuleProgressSummary(userId: string, totalModules: number) {
  const supabase = await createServerSupabaseClient();

  const { data: progressData, error: progressError } = await supabase
    .from('progress')
    .select('module_id, statut')
    .eq('user_id', userId);

  if (progressError) {
    throw new Error(`Failed to load module progress summary: ${progressError.message}`);
  }

  const completedCount = (progressData ?? []).filter((entry) => entry.statut === 'completed').length;
  const progressPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return { completedCount, progressPercentage };
}

export async function getModuleLearningSummary(userId: string, moduleId: number): Promise<ModuleLearningSummary> {
  const supabase = await createServerSupabaseClient();
  const [{ data: moduleData, error: moduleError }, { data: lessonsData, error: lessonsError }, { data: progressData, error: progressError }] = await Promise.all([
    supabase.from('modules').select('*').eq('id', moduleId).single(),
    supabase.from('lessons').select('*').eq('module_id', moduleId).order('ordre', { ascending: true }),
    supabase.from('lesson_progress').select('*').eq('user_id', userId).eq('module_id', moduleId),
  ]);

  if (moduleError || lessonsError || progressError) {
    throw new Error('Failed to load module learning summary.');
  }

  const lessons = (lessonsData ?? []) as Lesson[];
  const progress = (progressData ?? []) as LessonProgressSnapshot[];
  const completedLessons = progress.filter((entry) => entry.completed).length;
  const completionPercent = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const lastLessonId = progress.find((entry) => entry.completed)?.lessonId ?? lessons[0]?.id ?? null;

  return {
    module: moduleData as Module,
    lessons,
    completedLessons,
    completionPercent,
    lastLessonId,
  };
}
