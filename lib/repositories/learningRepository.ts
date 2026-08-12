import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Module, Lesson, Exercise } from '@/lib/types';
import type { QuizQuestion } from '@/lib/services/quizEngine';

export interface SocraticQuestion {
  id: number;
  exercise_id: number;
  question: string;
  hint: string | null;
  explanation: string | null;
  ordre: number;
}

export interface CourseContent {
  module: Module;
  lessons: Lesson[];
  exercises: Exercise[];
  quizQuestions: QuizQuestion[];
  socraticQuestions: SocraticQuestion[];
  nextModuleId: number | null;
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
    const first = moduleError || lessonsError || exercisesError || quizError;
    const source = moduleError
      ? 'modules'
      : lessonsError
        ? 'lessons'
        : exercisesError
          ? 'exercises'
          : 'quiz_questions';
    const err = new Error(first?.message ?? 'Unable to load learning content from the repository.') as Error & {
      details?: string;
      hint?: string;
      code?: string;
      source?: string;
    };
    err.details = first?.details;
    err.hint = first?.hint;
    err.code = first?.code;
    err.source = source;
    throw err;
  }

    const exercises = (exercisesData ?? []) as Exercise[];
    const exerciseIds = exercises.map((exercise) => exercise.id);

    let socraticQuestions: SocraticQuestion[] = [];
    if (exerciseIds.length > 0) {
      const { data: socraticData, error: socraticError } = await supabase
        .from('socratic_questions')
        .select('*')
        .in('exercise_id', exerciseIds)
        .order('ordre', { ascending: true });

      if (socraticError) {
        console.error('[learningRepository] failed to load socratic_questions', socraticError);
      } else {
        socraticQuestions = (socraticData ?? []) as SocraticQuestion[];
      }
    }

    let nextModuleId: number | null = null;
    if (moduleData?.ordre != null) {
      const { data: nextModuleData, error: nextModuleError } = await supabase
        .from('modules')
        .select('id')
        .eq('ordre', moduleData.ordre + 1)
        .limit(1)
        .maybeSingle();

      if (!nextModuleError && nextModuleData?.id != null) {
        nextModuleId = nextModuleData.id;
      }
    }

    return {
      module: moduleData as Module,
      lessons: (lessonsData ?? []) as Lesson[],
      exercises,
      quizQuestions: (quizData ?? []) as QuizQuestion[],
      socraticQuestions,
      nextModuleId,
    };
  }
