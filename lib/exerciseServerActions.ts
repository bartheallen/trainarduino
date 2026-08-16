"use server";

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase';
import { updateModuleProgress, getCompletedExercisesInModule } from '@/lib/db';
// Note: validation can be driven by external code-review results passed from the client.
import { initializeEventSystem } from '@/lib/events/bootstrap';
import * as events from '@/lib/repos/eventRepo';
import type { Exercise } from '@/lib/types';

export interface ExerciseSubmissionResult {
  score: number;
  verdict: string;
  xpAwarded: number;
  statut: 'approved' | 'rejected';
  exerciseId: number;
  issues: string[];
}

export interface PracticalValidationPayload {
  exerciseId: number;
  moduleId: number;
  passed: boolean;
  score: number;
  type: 'practical';
  status: 'approved' | 'rejected';
  xp: number;
  note: number;
}

export async function validatePracticalTestAction(
  exerciseId: number,
  code: string,
  userId: string,
  codeReview?: { correct?: boolean; issues?: string[]; feedback?: string } | null
): Promise<ExerciseSubmissionResult> {
  await initializeEventSystem();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }

  if (user.id !== userId) {
    throw new Error('User mismatch, unauthorized submission');
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (exerciseError || !exercise) {
    throw new Error(`Exercise ${exerciseId} introuvable`);
  }

  let analysisPayload: any = null;
  let validation: {
    passed: boolean;
    score: number;
    criteriaPassed?: string[];
    criteriaFailed?: string[];
    issues: { message: string }[];
    summary?: string;
  };

  if (codeReview && typeof codeReview === 'object') {
    const cr = codeReview as { correct?: boolean; issues?: string[]; feedback?: string };
    const isApprovedFromCR = cr.correct === true;
    validation = {
      passed: isApprovedFromCR,
      score: isApprovedFromCR ? 100 : 0,
      criteriaPassed: isApprovedFromCR ? ['validated_by_code_review'] : [],
      criteriaFailed: isApprovedFromCR ? [] : ['rejected_by_code_review'],
      issues: Array.isArray(cr.issues) ? cr.issues.map((m) => ({ message: m })) : [],
      summary: cr.feedback ?? (isApprovedFromCR ? 'Validé par correction IA' : 'Rejeté par correction IA'),
    };
  } else {
    // Fallback to legacy validation path using local validators/AI analysis
    const aiAnalysis = await import('@/lib/services/practicalAiAnalysisService').then((m) => m.analyzePracticalCodeWithAi).catch(() => null);
    const analyze = aiAnalysis ? await (aiAnalysis as any)(code, exercise as Exercise) : null;
    analysisPayload = analyze;
    const validate = await import('@/lib/services/practicalValidationService').then((m) => m.validatePracticalExercise).catch(() => null);
    if (validate) {
      validation = (validate as any)(code, exercise as Exercise, analyze?.criteria ?? null);
    } else {
      // If validators unavailable, default to rejection
      validation = { passed: false, score: 0, issues: [{ message: 'Validation unavailable' }], criteriaPassed: [], criteriaFailed: [], summary: 'Validation unavailable' };
    }
  }

  const isApproved = validation.passed;
  const statut = isApproved ? 'approved' : 'rejected';
  const xpAwarded = isApproved ? Math.max(10, Math.round((exercise as Exercise).xp_recompense * (validation.score / 100))) : 0;
  const note = Math.min(1, Math.max(0, validation.score / 100));

  if (process.env.DEBUG_PRACTICAL_VALIDATION === 'true') {
    console.debug('[practical-validation][final-mapping]', {
      exerciseId,
      criteriaPassed: validation.criteriaPassed,
      criteriaFailed: validation.criteriaFailed,
      issues: validation.issues,
      score: validation.score,
      passed: validation.passed,
      statut,
      xpAwarded,
      aiAnalysis: analysisPayload,
    });
  }

  const existingSubmission = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .single();

  const existingError = existingSubmission.error;
  if (existingError && existingError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification des soumissions existantes: ${existingError.message}`);
  }

  const { error } = await supabase
    .from('submissions')
    .upsert(
      [
        {
          user_id: user.id,
          exercise_id: exerciseId,
          code_soumis: code,
          statut,
          xp_gagne: xpAwarded,
          note,
          feedback_ia: JSON.stringify({
            practicalValidation: {
              passed: isApproved,
              score: validation.score,
              criteriaPassed: validation.criteriaPassed,
              criteriaFailed: validation.criteriaFailed,
              errors: validation.issues.map((issue) => issue.message),
              summary: validation.summary,
            },
          }),
        },
      ],
      { onConflict: 'user_id,exercise_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Impossible d’enregistrer la soumission : ${error.message}`);
  }

  // XP is granted through the ProgressUpdated -> XpAwarded event flow.
  // This avoids duplicate rewards when the practical validation path also emits progress events.
  const practicalPayload: PracticalValidationPayload = {
    exerciseId,
    moduleId: (exercise as Exercise).module_id,
    passed: isApproved,
    score: validation.score,
    type: 'practical',
    status: statut,
    xp: xpAwarded,
    note,
  };

  const shouldEmitProgress = isApproved && (!existingSubmission.data || existingSubmission.data.statut !== 'approved');

  if (shouldEmitProgress) {
    // Debug trigger log before publishing events that should invoke progressSubscriber
    try {
      console.log('[debug-trigger] about to publish event', { isApproved, statut, moduleId: practicalPayload.moduleId });
    } catch (e) {
      // ignore
    }

    try {
      await events.emitEvent(user.id, 'ExerciseValidated', practicalPayload, { source: 'exercise' });
    } catch (err) {
      console.error('[debug-trigger] event publish failed (ExerciseValidated)', err);
    }
  }

  if (isApproved && shouldEmitProgress) {
    try {
      await events.emitEvent(user.id, 'ProjectCompleted', {
        exerciseId,
        moduleId: (exercise as Exercise).module_id,
        completedAt: new Date().toISOString(),
        goal: 'practical_test',
        practicalTestPassed: true,
        practicalTestCompleted: true,
        source: 'practical',
      }, { source: 'exercise' });
    } catch (err) {
      console.error('[debug-trigger] event publish failed (ProjectCompleted)', err);
    }
  }

  // Direct synchronous unlock: mark current module completed and unlock next
  if (isApproved) {
    try {
      const currentModuleId = (exercise as Exercise).module_id;
      // compute completed exercises count for the module to store in progress
      let completedCount = 0;
      try {
        completedCount = await getCompletedExercisesInModule(user.id, currentModuleId);
      } catch (e) {
        // non-fatal: keep completedCount = 0
      }

      // Mark current module as completed
      await updateModuleProgress(user.id, currentModuleId, 'completed', Math.round(validation.score), completedCount).catch((err) => {
        console.error('[direct-unlock] failed to mark current module completed', { userId: user.id, moduleId: currentModuleId, err });
      });

      // Find next module by ordre = current.ordre + 1
      try {
        const { data: currentModuleData, error: currentModuleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', currentModuleId)
          .single();

        if (!currentModuleError && currentModuleData) {
          const nextOrdre = (currentModuleData as any).ordre + 1;
          const { data: nextModuleData, error: nextModuleError } = await supabase
            .from('modules')
            .select('*')
            .eq('ordre', nextOrdre)
            .single();

          if (!nextModuleError && nextModuleData) {
            await updateModuleProgress(user.id, (nextModuleData as any).id, 'in_progress', 0, 0).catch((err) => {
              console.error('[direct-unlock] failed to unlock next module', { userId: user.id, nextModuleId: (nextModuleData as any).id, err });
            });

            try {
              console.log('[direct-unlock] module completed and next unlocked', { userId: user.id, moduleId: currentModuleId, nextModuleId: (nextModuleData as any).id });
            } catch (e) {
              // ignore logging errors
            }
          }
        }
      } catch (err) {
        console.error('[direct-unlock] error while finding/unlocking next module', err);
      }
    } catch (err) {
      console.error('[direct-unlock] unexpected error', err);
    }
  }

  if (isApproved && shouldEmitProgress) {
    revalidatePath('/dashboard');
  }

  return {
    score: validation.score,
    verdict: validation.summary ?? 'Validation pratique exécutée',
    xpAwarded,
    statut,
    exerciseId,
    issues: validation.issues.map((issue) => issue.message),
  };
}

export async function submitExerciseAction(
  exerciseId: number,
  code: string,
  userId: string
): Promise<ExerciseSubmissionResult> {
  return validatePracticalTestAction(exerciseId, code, userId);
}

export async function confirmPracticalCompletionAction(
  exerciseId: number,
  userId: string
): Promise<ExerciseSubmissionResult> {
  await initializeEventSystem();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilisateur non authentifié');
  }

  if (user.id !== userId) {
    throw new Error('User mismatch, unauthorized confirmation');
  }

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (exerciseError || !exercise) {
    throw new Error(`Exercise ${exerciseId} introuvable`);
  }

  // Check existing submission
  const existingSubmission = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .single();

  const existingError = existingSubmission.error;
  if (existingError && existingError.code !== 'PGRST116') {
    throw new Error(`Erreur lors de la vérification des soumissions existantes: ${existingError.message}`);
  }

  // If already approved, return early
  if (existingSubmission.data && existingSubmission.data.statut === 'approved') {
    return {
      score: existingSubmission.data.note != null ? Math.round(existingSubmission.data.note * 100) : 100,
      verdict: 'confirmed',
      xpAwarded: 0,
      statut: 'approved',
      exerciseId,
      issues: [],
    };
  }

  // Upsert a confirmation submission but do not award XP here (xpAwarded = 0)
  const { error } = await supabase
    .from('submissions')
    .upsert(
      [
        {
          user_id: user.id,
          exercise_id: exerciseId,
          code_soumis: existingSubmission.data?.code_soumis ?? null,
          statut: 'approved',
          xp_gagne: 0,
          note: existingSubmission.data?.note ?? 1,
          feedback_ia: JSON.stringify({ confirmedByLearner: true, confirmedAt: new Date().toISOString() }),
        },
      ],
      { onConflict: 'user_id,exercise_id' }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Impossible d’enregistrer la confirmation : ${error.message}`);
  }

  // Emit progress events without awarding XP
  const practicalPayload = {
    exerciseId,
    moduleId: (exercise as Exercise).module_id,
    passed: true,
    score: 100,
    type: 'practical' as const,
    status: 'approved' as const,
    xp: 0,
    note: 1,
  };

  await events.emitEvent(user.id, 'ExerciseValidated', practicalPayload, { source: 'practical_confirmation' }).catch(() => null);
  await events.emitEvent(user.id, 'ProgressUpdated', practicalPayload, { source: 'practical_confirmation' }).catch(() => null);
  await events.emitEvent(user.id, 'ProjectCompleted', {
    exerciseId,
    moduleId: (exercise as Exercise).module_id,
    completedAt: new Date().toISOString(),
    goal: 'practical_test',
    practicalTestPassed: true,
    practicalTestCompleted: true,
    source: 'practical_confirmation',
  }, { source: 'practical_confirmation' }).catch(() => null);

  // revalidate dashboard cache
  try {
    revalidatePath('/dashboard');
  } catch (e) {
    // ignore in non-next runtime
  }

  return {
    score: 100,
    verdict: 'confirmed',
    xpAwarded: 0,
    statut: 'approved',
    exerciseId,
    issues: [],
  };
}
