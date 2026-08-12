"use client";

import { useState } from 'react';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import type { SocraticQuestion } from '@/lib/repositories/learningRepository';

interface Props {
  questions?: SocraticQuestion[];
  onComplete?: () => void;
}

interface ReviewResult {
  correct: boolean;
  feedback: string;
}

export function SocraticTutorPanel({ questions = [], onComplete = () => {} }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answer, setAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allowContinue, setAllowContinue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!questions || questions.length === 0) {
    return (
      <PrimitiveCard tone="glass" className="p-4">
        <p className="text-sm text-slate-300">Aucune question guidée pour cet exercice pour le moment.</p>
      </PrimitiveCard>
    );
  }

  const total = questions.length;
  const current = questions[currentIndex];
  const isLast = currentIndex === total - 1;

  function resetForNextQuestion() {
    setCurrentIndex((i) => i + 1);
    setAnswer('');
    setShowHint(false);
    setShowExplanation(false);
    setReviewResult(null);
    setError(null);
    setAllowContinue(false);
  }

  function handleNext() {
    if (answer.trim().length === 0) return;
    if (isLast) {
      setIsCompleted(true);
      onComplete();
      return;
    }
    resetForNextQuestion();
  }

  async function handleVerify() {
    if (answer.trim().length === 0) return;
    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const response = await fetch('/api/socratic-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: current.question,
          hint: current.hint,
          explanation: current.explanation,
          answer,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(typeof payload?.error === 'string' ? payload.error : 'Impossible de vérifier pour le moment, réessayez.');
      } else {
        setReviewResult({ correct: payload.correct === true, feedback: typeof payload.feedback === 'string' ? payload.feedback : '' });
        setAllowContinue(payload.correct === true);
      }
    } catch {
      setError('Impossible de vérifier pour le moment, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PrimitiveCard tone="floating" className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Question guidée</h3>
        <PrimitiveBadge tone="accent">Question {currentIndex + 1}/{total}</PrimitiveBadge>
      </div>

      <div className="mt-3">
        <p className="text-sm text-slate-200 leading-7">{current.question}</p>
      </div>

      {!isCompleted && (
        <>
          <div className="mt-3">
            <textarea
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setReviewResult(null);
                setError(null);
                setAllowContinue(false);
              }}
              rows={5}
              className="w-full rounded-lg bg-slate-900/60 border border-white/6 p-3 text-sm text-slate-200 placeholder:text-slate-500"
              placeholder="Tapez votre réponse ici..."
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowHint((s) => !s)}
              className="rounded-md bg-cyan-600/10 px-3 py-1 text-sm text-cyan-200 hover:bg-cyan-600/20"
            >
              Voir l&apos;indice
            </button>

            <button
              type="button"
              onClick={() => setShowExplanation((s) => !s)}
              className="rounded-md bg-slate-700/40 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700/60"
            >
              Voir l&apos;explication
            </button>
          </div>
        </>
      )}

      {isCompleted && (
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          Le parcours est maintenant terminé. L&apos;éditeur est débloqué et vous pouvez poursuivre votre exercice.
        </div>
      )}

      {showHint && current.hint && (
        <div className="mt-3 rounded-md bg-slate-950/60 p-3 text-sm text-slate-300">{current.hint}</div>
      )}

      {showExplanation && current.explanation && (
        <div className="mt-3 rounded-md bg-slate-950/60 p-3 text-sm text-slate-300">{current.explanation}</div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      {reviewResult && (
        <div className={`mt-4 rounded-2xl border p-3 text-sm ${reviewResult.correct ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-400/20 bg-amber-500/10 text-amber-100'}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{reviewResult.correct ? 'Bonne réponse' : 'Réponse incorrecte'}</p>
            <PrimitiveBadge tone={reviewResult.correct ? 'success' : 'warning'}>
              {reviewResult.correct ? 'Correct' : 'À retravailler'}
            </PrimitiveBadge>
          </div>
          <p className="mt-2 text-sm leading-6">{reviewResult.feedback}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!isCompleted && (
          <>
            <button
              type="button"
              disabled={answer.trim().length === 0 || loading}
              onClick={handleVerify}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                answer.trim().length === 0 || loading
                  ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              {loading ? 'Vérification...' : 'Vérifier ma réponse'}
            </button>

            {(reviewResult?.correct || allowContinue) && (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                {isLast ? 'Terminer' : 'Suivant'}
              </button>
            )}

            {!reviewResult?.correct && answer.trim().length > 0 && !loading && (
              <button
                type="button"
                onClick={() => setAllowContinue(true)}
                className="text-sm text-slate-300 underline-offset-2 hover:text-white"
              >
                Continuer quand même →
              </button>
            )}
          </>
        )}

        {isCompleted && (
          <div className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100">
            ✅ Parcours terminé — l&apos;éditeur est débloqué
          </div>
        )}
      </div>
    </PrimitiveCard>
  );
}

export default SocraticTutorPanel;
