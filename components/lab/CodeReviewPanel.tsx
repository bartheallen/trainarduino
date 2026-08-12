'use client';

import { useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

interface CodeReviewPanelProps {
  code: string;
  exerciseTitre: string;
  exerciseEnonce: string;
  onResult?: (result: CodeReviewResult | null) => void;
}

export interface CodeReviewResult {
  correct: boolean;
  issues: string[];
  feedback: string;
}

export function CodeReviewPanel({ code, exerciseTitre, exerciseEnonce, onResult }: CodeReviewPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CodeReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/code-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, exerciseTitre, exerciseEnonce }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(typeof payload?.error === 'string' ? payload.error : 'Impossible de corriger le code pour le moment.');
        if (onResult) onResult(null);
      } else {
        const mapped = {
          correct: payload.correct === true,
          issues: Array.isArray(payload.issues) ? payload.issues.filter((issue: unknown): issue is string => typeof issue === 'string') : [],
          feedback: typeof payload.feedback === 'string' ? payload.feedback : '',
        };
        setResult(mapped);
        if (onResult) onResult(mapped);
      }
    } catch {
      setError('Impossible de vérifier pour le moment, réessayez.');
      if (onResult) onResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PrimitiveCard tone="glass" className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Correction IA du code</p>
            <p className="text-xs text-slate-500">Analyse rapide du code par rapport à l&apos;énoncé de l&apos;exercice.</p>
          </div>
          <PrimitiveBadge tone="accent">IA</PrimitiveBadge>
        </div>

        <button
          type="button"
          onClick={handleReview}
          disabled={loading}
          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
            loading ? 'bg-slate-700 text-slate-300 cursor-not-allowed' : 'bg-cyan-500 text-white hover:bg-cyan-600'
          }`}
        >
          {loading ? 'Correction en cours...' : 'Faire corriger mon code par l’IA'}
        </button>

        {error && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-2xl border p-3 text-sm ${result.correct ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-400/20 bg-amber-500/10 text-amber-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{result.correct ? 'Code correct' : 'Points à améliorer'}</p>
              <PrimitiveBadge tone={result.correct ? 'success' : 'warning'}>
                {result.correct ? 'Bon' : 'Attention'}
              </PrimitiveBadge>
            </div>
            <p className="mt-2 text-sm leading-6">{result.feedback}</p>
            {result.issues.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-100">
                {result.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </PrimitiveCard>
  );
}
