'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Lesson, Module } from '@/lib/types';

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
