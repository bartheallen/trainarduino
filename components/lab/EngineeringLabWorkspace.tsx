'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { CodeEditor } from '@/components/lab/CodeEditor';
import { CodeReviewPanel } from '@/components/lab/CodeReviewPanel';
import { WokwiEmbed } from '@/components/lab/WokwiEmbed';
import { WokwiHelpPanel } from '@/components/lab/WokwiHelpPanel';
import { SocraticTutorPanel } from '@/components/tutor/SocraticTutorPanel';
import { CircuitChipIcon } from '@/components/ui/ElectronicsIcons';
import type { CodeReviewResult } from '@/components/lab/CodeReviewPanel';
import type { Exercise } from '@/lib/types';
import type { SocraticQuestion } from '@/lib/repositories/learningRepository';
import { LessonReaderStep } from '@/components/lab/LessonReaderStep';

interface EngineeringLabWorkspaceProps {
  module: {
    id: number;
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
    is_capstone?: boolean;
  };
  lessons: Array<{
    id: number;
    titre: string;
    contenu: string;
    image_url?: string | null;
  }>;
  exercises: Exercise[];
  socraticQuestions?: SocraticQuestion[];
  currentUserId?: string;
  moduleStatus: 'locked' | 'in_progress' | 'completed';
  nextModuleId?: number | null;
}

export function EngineeringLabWorkspace({ module, lessons, exercises, socraticQuestions = [], currentUserId = '', moduleStatus = 'locked', nextModuleId = null }: EngineeringLabWorkspaceProps) {
  const [code, setCode] = useState('');
  const [socraticCompleted, setSocraticCompleted] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [lessonsRead, setLessonsRead] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('Non testé');
  const [codeReviewResult, setCodeReviewResult] = useState<CodeReviewResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ severity: 'error' | 'warning' | 'success'; message: string; hint: string }>>([]);
  const [validationCriteria, setValidationCriteria] = useState<string[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [exerciseEnonceExpanded, setExerciseEnonceExpanded] = useState(false);

  const firstExercise = exercises[0];
  const exerciseEnonce = firstExercise?.enonce?.trim() ?? '';
  const exerciseEnonceLong = exerciseEnonce.length > 700;
  const simulationUrl = firstExercise?.wokwi_project_url ?? null;
  const router = useRouter();
  const isModuleCompleted = moduleStatus === 'completed';

  async function handleSocraticComplete() {
    if (!currentUserId || !module.id) {
      setSocraticCompleted(true);
      setProgressMessage('La phase guidée est marquée comme terminée localement.');
      return;
    }

    try {
      const response = await fetch('/api/learning-progress/socratic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: module.id }),
      });

      if (!response.ok) {
        throw new Error((await response.text()) || 'Impossible d’enregistrer la progression guidée.');
      }

      setSocraticCompleted(true);
      setProgressMessage('Votre progression a bien été enregistrée pour ce module.');
    } catch (error) {
      console.error('[engineering-lab] failed to persist socratic completion', error);
      setProgressMessage('La progression a été marquée localement, mais l’enregistrement a échoué.');
      setSocraticCompleted(true);
    }
  }

  async function handleValidateProject() {
    if (!currentUserId || !firstExercise?.id) {
      setValidationState('error');
      setProgressMessage('❌ Projet non validé — impossible d’enregistrer la validation sans exercice associé.');
      return;
    }

    setAttemptCount((value) => value + 1);
    setValidationState('loading');
    setValidationIssues([]);
    setValidationCriteria([]);
    setValidationMessage('Vérification du projet…');
    setProgressMessage('Validation du projet en cours…');
    try {
      // Ensure user has run the AI code review first
      if (!codeReviewResult) {
        setValidationState('error');
        setProgressMessage('Veuillez d’abord faire corriger votre code par l’IA avant de valider le module.');
        setValidationMessage('❌ À corriger');
        setValidationIssues([]);
        return;
      }

      if (codeReviewResult.correct !== true) {
        setValidationState('error');
        setValidationMessage('❌ À corriger');
        setProgressMessage('Le code n’est pas correct selon la correction IA. Corrigez les points listés puis réessayez.');
        setValidationIssues(codeReviewResult.issues.map((m) => ({ severity: 'error' as const, message: m, hint: '' })));
        return;
      }

      // If AI says correct, use server route to persist and trigger direct-unlock
      const resp = await fetch('/api/validate-practical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: firstExercise.id, code, codeReview: codeReviewResult }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Validation request failed');
      }

      const result = await resp.json();

      if (result.statut === 'approved') {
        setValidationState('success');
        setValidationMessage('✅ Validé');
        setProgressMessage('✅ Projet validé — la soumission pratique a été enregistrée.');
        setValidationIssues([]);
        try { router.refresh(); } catch (e) {}
      } else {
        setValidationState('error');
        setValidationMessage('❌ À corriger');
        setProgressMessage('❌ Projet non validé — la validation côté serveur a échoué.');
        if (result.issues?.length > 0) {
          setValidationIssues(result.issues.map((message: string) => ({ severity: 'error' as const, message, hint: '' })));
        }
      }
    } catch (error) {
      console.error('[engineering-lab] failed to validate project', error);
      setValidationState('error');
      setValidationMessage('❌ À corriger');
      setProgressMessage('❌ Projet non validé — la validation a échoué.');
      setValidationIssues([
        {
          severity: 'error',
          message: 'Erreur serveur lors de la validation du projet.',
          hint: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
        },
      ]);
    }
  }

  return (
    <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
            <CircuitChipIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Engineering Lab</p>
            <h1 className="break-words text-xl font-semibold text-white">{module.titre}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrimitiveBadge tone={module.is_capstone ? 'success' : 'accent'}>
            {module.is_capstone ? '🏆 Projet final — Niveau 1' : 'Version 1.0'}
          </PrimitiveBadge>
          <PrimitiveBadge tone={socraticCompleted ? 'success' : 'accent'}>{socraticCompleted ? 'Terminé' : 'À faire'}</PrimitiveBadge>
        </div>
      </div>

      <PrimitiveCard tone="glass" className="min-w-0 p-4">
        <div className="mt-4 min-w-0">
          {!lessonsRead ? (
            <LessonReaderStep lessons={lessons} onComplete={() => setLessonsRead(true)} />
          ) : (
            <SocraticTutorPanel questions={socraticQuestions} onComplete={handleSocraticComplete} />
          )}
        </div>
        {progressMessage && (
          <div className="mt-3 rounded-[1rem] border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
            {progressMessage}
          </div>
        )}
      </PrimitiveCard>

      {exerciseEnonce ? (
        <PrimitiveCard tone="glass" className="min-w-0 p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">📝 Ce que vous devez coder</p>
            {exerciseEnonceLong ? (
              <button
                type="button"
                onClick={() => setExerciseEnonceExpanded((value) => !value)}
                className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20"
              >
                {exerciseEnonceExpanded ? 'Réduire' : 'Voir tout'}
              </button>
            ) : null}
          </div>
          <div className={`mt-3 min-w-0 whitespace-pre-line break-words text-sm leading-7 text-slate-200 ${exerciseEnonceLong && !exerciseEnonceExpanded ? 'max-h-64 overflow-hidden' : ''}`}>
            {exerciseEnonceLong && !exerciseEnonceExpanded ? `${exerciseEnonce.slice(0, 900)}...` : exerciseEnonce}
          </div>
        </PrimitiveCard>
      ) : null}

      <PrimitiveCard tone="raised" className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Éditeur de code</p>
            <p className="mt-2 text-sm text-slate-400">Le starter est vide : votre code démarre à partir de zéro.</p>
          </div>
          <PrimitiveBadge tone="neutral">Vide</PrimitiveBadge>
        </div>
        <div className="mt-4 overflow-hidden rounded-[1.15rem] border border-white/10 bg-slate-950/80 p-3">
          <CodeEditor value={code} onChange={setCode} />
        </div>
        {code.trim().length > 0 ? (
          <div className="mt-3 rounded-[1rem] border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            Votre solution est en cours de rédaction.
          </div>
        ) : (
          <div className="mt-3 rounded-[1rem] border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-400">
            Commencez par ajouter vos propres instructions et fonctions Arduino.
          </div>
        )}
      </PrimitiveCard>

      <div className="mt-4">
        <CodeReviewPanel code={code} exerciseTitre={firstExercise?.titre ?? ''} exerciseEnonce={firstExercise?.enonce ?? ''} onResult={setCodeReviewResult} />
      </div>

      <div className="mt-4">
        <PrimitiveCard tone="glass" className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Circuit & Simulation</p>
              <p className="mt-2 text-sm text-slate-400">La simulation devient disponible une fois la phase guidée terminée.</p>
            </div>
            <PrimitiveBadge tone={socraticCompleted ? 'success' : 'neutral'}>{socraticCompleted ? 'Débloqué' : 'Verrouillé'}</PrimitiveBadge>
          </div>

          {socraticCompleted ? (
            <div className="mt-4 space-y-4">
              {exercises[0]?.circuit_instructions ? (
                <PrimitiveCard tone="glass" className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <p className="font-semibold text-white">🔧 Circuit à construire</p>
                  <div className="mt-2 whitespace-pre-line text-slate-300">
                    {exercises[0].circuit_instructions}
                  </div>
                </PrimitiveCard>
              ) : null}
              <WokwiHelpPanel />
              <WokwiEmbed wokwiUrl={simulationUrl} />
              <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
                La simulation est prête à être utilisée pour valider votre solution.
              </div>

              <div className="rounded-[1.15rem] border border-cyan-400/20 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Test pratique final</p>
                    <p className="mt-2 text-sm text-slate-300">Construis le circuit demandé dans Wokwi, lance la simulation puis vérifie ton projet.</p>
                  </div>
                  <PrimitiveBadge tone={validationState === 'success' ? 'success' : validationState === 'error' ? 'danger' : 'neutral'}>
                    {validationState === 'success' ? 'Validé' : validationState === 'error' ? 'À corriger' : 'À tester'}
                  </PrimitiveBadge>
                </div>

                <div className="mt-4 rounded-[1rem] border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">Mission pratique</p>
                  <p className="mt-3 text-slate-300">
                    {firstExercise?.enonce ?? 'Réalisez un montage Arduino correspondant à la mission du module.'}
                  </p>
                  {firstExercise?.critere_correction ? (
                    <div className="mt-3 rounded-[1rem] border border-cyan-400/20 bg-slate-950/70 p-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Objectif</p>
                      <p className="mt-2 text-slate-300">{firstExercise.critere_correction}</p>
                    </div>
                  ) : null}
                  {firstExercise?.circuit_instructions ? (
                    <div className="mt-3 rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Consignes de circuit</p>
                      <p className="mt-2 text-slate-300">{firstExercise.circuit_instructions}</p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[1rem] border border-cyan-400/20 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">Étapes</p>
                  <ol className="mt-2 list-decimal space-y-2 pl-5">
                    <li>
                      <span className="font-semibold text-slate-100">① Écris ton programme</span>
                      <div>Utilise l’éditeur de code TrainArduino pour écrire ton programme Arduino.</div>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">② Construis ton circuit dans Wokwi</span>
                      <div>Crée le circuit dans Wokwi pour réaliser la mission demandée.</div>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">③ Recopie ton code dans Wokwi</span>
                      <div>Colle le même code Arduino que tu as écrit dans TrainArduino dans l’éditeur Wokwi.</div>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">④ Lance la simulation</span>
                      <div>Teste le montage et vérifie le comportement du circuit.</div>
                    </li>
                    <li>
                      <span className="font-semibold text-slate-100">⑤ Vérifie le résultat</span>
                      <div>Si le résultat correspond à la mission, confirme ta réussite.</div>
                    </li>
                  </ol>
                </div>

                <div className="mt-4 rounded-[1rem] border border-amber-400/20 bg-slate-900/70 p-3 text-sm text-amber-100">
                  <p className="font-semibold text-white">Important</p>
                  <p className="mt-2 text-slate-300">Nous ne pouvons pas vérifier automatiquement ta simulation Wokwi pour le moment. Confirme uniquement si tu as réellement réussi le défi pratique dans Wokwi.</p>
                </div>

                <div className="mt-4 rounded-[1rem] border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">Critères vérifiés</p>
                  {validationCriteria.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {validationCriteria.map((criterion) => (
                        <li key={criterion}>{criterion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-slate-400">Les critères seront affichés ici après vérification.</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleValidateProject}
                    disabled={validationState === 'loading'}
                    className="inline-flex items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {validationState === 'loading' ? 'Vérification…' : 'Valider le module'}
                  </button>
                  <span className="text-sm text-slate-400">État : {validationMessage}</span>
                  <span className="text-sm text-slate-500">Tentatives : {attemptCount}</span>
                </div>

                {validationState !== 'idle' && (
                  <div className={`mt-3 rounded-[1rem] border px-3 py-2 text-sm ${validationState === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border-red-400/20 bg-red-400/10 text-red-100'}`}>
                    {validationState === 'success' ? '✅ Validé' : '❌ À corriger'}
                  </div>
                )}

                {validationIssues.length > 0 && (
                  <div className="mt-3 rounded-[1rem] border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">
                    <p className="font-semibold">Erreurs détectées</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {validationIssues.map((issue) => (
                        <li key={`${issue.message}-${issue.hint}`}>
                          {issue.message}
                          {issue.hint ? ` — ${issue.hint}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.15rem] border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">
              Complétez la phase guidée pour débloquer la simulation et la suite du parcours.
            </div>
          )}
        </PrimitiveCard>
      </div>

      <div className="mt-4">
        {isModuleCompleted ? (
          nextModuleId ? (
            <Link href={`/modules/${nextModuleId}`} className="inline-flex items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20">
              Module suivant →
            </Link>
          ) : module.is_capstone ? (
            <div className="rounded-[1.15rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">🏁 Félicitations, vous avez terminé le projet final !</p>
              <p className="mt-2 text-slate-200">Votre parcours est maintenant complet — revenez au dashboard pour consulter vos badges et votre niveau.</p>
              <Link href="/dashboard" className="mt-3 inline-flex text-cyan-100 underline-offset-2 hover:underline">
                Retour au dashboard
              </Link>
            </div>
          ) : (
            <div className="rounded-[1.15rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold">🎉 Vous avez terminé tous les modules disponibles !</p>
              <Link href="/dashboard" className="mt-2 inline-flex text-cyan-100 underline-offset-2 hover:underline">
                Retour au dashboard
              </Link>
            </div>
          )
        ) : (
          <div className="rounded-[1.15rem] border border-amber-400/20 bg-slate-900/70 p-4 text-sm text-amber-100">
            <p className="font-semibold">🔒 Module suivant verrouillé</p>
            <div className="mt-2 text-slate-300">Terminez ce module pour débloquer la prochaine étape du parcours.</div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Parcours du module</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              {module.description ?? 'Suivez le tutorat, rédigez votre solution puis débloquez la simulation et la suite du parcours.'}
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100">
            {lessons.length} leçons • {exercises.length} exercices
          </div>
        </div>
      </div>
    </div>
  );
}
