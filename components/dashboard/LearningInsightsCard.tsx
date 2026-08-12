'use client';

import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';

interface LearningInsightsCardProps {
  mastery: number;
  weakConcepts: string[];
  recommendedExercises: string[];
  projectedProgress: number;
}

export function LearningInsightsCard({
  mastery,
  weakConcepts,
  recommendedExercises,
  projectedProgress,
}: LearningInsightsCardProps) {
  return (
    <PrimitiveCard tone="glass" className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Insights d’apprentissage</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Une vue plus claire de votre progression</h3>
        </div>
        <PrimitiveBadge tone="accent">Prédiction</PrimitiveBadge>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Maîtrise globale</span>
            <span>{mastery}%</span>
          </div>
          <PrimitiveProgress value={mastery} />
        </div>

        <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-white">Concepts à renforcer</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weakConcepts.length > 0 ? weakConcepts.map((concept) => (
              <span key={concept} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-sm text-amber-100">
                {concept}
              </span>
            )) : <span className="text-sm text-slate-400">Aucun concept faible détecté.</span>}
          </div>
        </div>

        <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-white">Exercices conseillés</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {recommendedExercises.map((exercise) => <li key={exercise}>• {exercise}</li>)}
          </ul>
        </div>

        <div className="rounded-[1.1rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Prévision de progression</p>
          <p className="mt-2">Votre progression devrait atteindre environ {projectedProgress}% d’achèvement au prochain cycle.</p>
        </div>
      </div>
    </PrimitiveCard>
  );
}
