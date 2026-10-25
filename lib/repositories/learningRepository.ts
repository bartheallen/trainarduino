import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Module, Lesson, Exercise } from '@/lib/types';
import type { QuizQuestion } from '@/lib/services/quizEngine';

export interface CourseContent {
  module: Module;
  lessons: Lesson[];
  exercises: Exercise[];
  quizQuestions: QuizQuestion[];
}

export async function getCourseContent(moduleId: number): Promise<CourseContent> {
  const supabase = await createServerSupabaseClient();
  const [{ data: moduleData, error: moduleError }, { data: lessonsData, error: lessonsError }, { data: exercisesData, error: exercisesError }, { data: quizData, error: quizError }] = await Promise.all([
    supabase.from('modules').select('*').eq('id', moduleId).single(),
    supabase.from('lessons').select('*').eq('module_id', moduleId).order('ordre', { ascending: true }),
    supabase.from('exercises').select('*').eq('module_id', moduleId).order('ordre', { ascending: true }),
    supabase.from('quiz_questions').select('*').order('ordre', { ascending: true }),
  ]);

  if (moduleError || lessonsError || exercisesError || quizError) {
    throw new Error('Unable to load learning content from the repository.');
  }

  return {
    module: moduleData as Module,
    lessons: (lessonsData ?? []) as Lesson[],
    exercises: (exercisesData ?? []) as Exercise[],
    quizQuestions: (quizData ?? []) as QuizQuestion[],
  };
}
