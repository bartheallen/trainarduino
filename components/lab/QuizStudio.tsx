'use client';

import { useMemo, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { evaluateQuiz, type QuizQuestion } from '@/lib/services/quizEngine';

interface QuizStudioProps {
  questions: QuizQuestion[];
}

export function QuizStudio({ questions }: QuizStudioProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => evaluateQuiz(questions, answers), [answers, questions]);

  return (
    <PrimitiveCard tone="floating" className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Quiz studio</p>
          <h3 className="text-lg font-semibold text-white">Validation interactive</h3>
        </div>
        <PrimitiveBadge tone="accent">{questions.length} questions</PrimitiveBadge>
      </div>

      <div className="mt-4 space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-4">
            <p className="text-sm font-semibold text-white">{index + 1}. {question.prompt}</p>
            {question.options?.length ? (
              <div className="mt-3 space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-[0.9rem] border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                    <input type="radio" name={question.id} value={option} checked={String(answers[question.id] ?? '') === option} onChange={() => {
                      setAnswers((current) => ({ ...current, [question.id]: option }));
                      setSubmitted(false);
                    }} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <button onClick={() => setSubmitted(true)} className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/40">
        Soumettre le quiz
      </button>

      {submitted ? (
        <div className="mt-4 rounded-[1rem] border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">Résultat</p>
          <p className="mt-2">Score : {result.score}/{result.total}</p>
          <p className="mt-1">Pourcentage : {result.percentage}%</p>
          <p className="mt-1">Statut : {result.passed ? 'Réussi' : 'À retravailler'}</p>
        </div>
      ) : null}
    </PrimitiveCard>
  );
}
