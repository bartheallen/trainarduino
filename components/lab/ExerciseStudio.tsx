'use client';

import { useMemo, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { validateArduinoCode } from '@/lib/services/learningEngine';
import type { Exercise } from '@/lib/types';

interface ExerciseStudioProps {
  exercise: Exercise;
}

const starterCode = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`;

export function ExerciseStudio({ exercise }: ExerciseStudioProps) {
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<ReturnType<typeof validateArduinoCode> | null>(null);

  const validation = useMemo(() => validateArduinoCode(code, exercise), [code, exercise]);

  return (
    <PrimitiveCard tone="floating" className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Exercise studio</p>
            <h3 className="text-lg font-semibold text-white">{exercise.titre}</h3>
          </div>
          <PrimitiveBadge tone="accent">{exercise.difficulte}</PrimitiveBadge>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300">
            <p className="font-semibold text-white">Énoncé</p>
            <p className="mt-2">{exercise.enonce}</p>
            <p className="mt-3 text-slate-400">Objectif : créer un programme Arduino fonctionnel respectant les contraintes de validation.</p>
          </div>

          <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Éditeur</p>
              <button onClick={() => setCode(starterCode)} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-slate-200 transition hover:border-cyan-400/20">Reset</button>
            </div>
            <textarea value={code} onChange={(event) => setCode(event.target.value)} className="min-h-[240px] w-full rounded-[1rem] border border-white/10 bg-black/70 p-3 font-mono text-sm text-slate-200 outline-none" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Validation</p>
              <PrimitiveBadge tone={validation.passed ? 'success' : validation.verdict === 'warning' ? 'neutral' : 'warning'}>{validation.score}/100</PrimitiveBadge>
            </div>
            <div className="mt-3 space-y-2">
              {validation.issues.map((issue) => (
                <div key={`${issue.message}-${issue.severity}`} className={`rounded-[0.9rem] border px-3 py-2 ${issue.severity === 'error' ? 'border-rose-400/20 bg-rose-400/10 text-rose-100' : issue.severity === 'warning' ? 'border-amber-400/20 bg-amber-400/10 text-amber-100' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>
                  <p className="font-medium">{issue.message}</p>
                  <p className="mt-1 text-xs opacity-80">{issue.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setResult(validation)} className="w-full rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/40">
            Valider le code
          </button>

          {result ? (
            <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Résultat</p>
              <p className="mt-2">Score : {result.score}/100</p>
              <p className="mt-1">XP : {result.xpAwarded}</p>
              <p className="mt-1">Statut : {result.passed ? 'Validé' : 'À améliorer'}</p>
            </div>
          ) : null}
        </div>
      </div>
    </PrimitiveCard>
  );
}
