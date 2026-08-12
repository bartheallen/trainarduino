'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { saveLessonProgressAction } from '@/lib/services/learningProgressService';
import type { Lesson, Module } from '@/lib/types';

interface LessonReaderProps {
  module: Module;
  lesson: Lesson;
  lessons: Lesson[];
  currentUserId: string;
}

function parseMarkdownContent(content: string) {
  return content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => line.trim());
}

export function LessonReader({ module, lesson, lessons, currentUserId }: LessonReaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const params = useParams<{ id?: string; lessonId?: string }>();
  const [progressPercent, setProgressPercent] = useState(15);
  const [completed, setCompleted] = useState(false);
  const currentIndex = useMemo(() => lessons.findIndex((entry) => entry.id === lesson.id), [lesson.id, lessons]);
  const currentLessonId = Number(params.lessonId ?? lesson.id);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgressPercent((prev) => Math.min(100, prev + 5));
      if (progressPercent >= 95) {
        setCompleted(true);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [lesson.id, progressPercent]);

  useEffect(() => {
    const persistProgress = async () => {
      if (!currentUserId) {
        return;
      }

      await saveLessonProgressAction(currentUserId, module.id, currentLessonId, progressPercent, completed);
    };

    void persistProgress();
  }, [completed, currentLessonId, currentUserId, module.id, progressPercent]);

  const paragraphs = useMemo(() => parseMarkdownContent(lesson.contenu), [lesson.contenu]);
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#071016_0%,_#0d1b23_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Lesson reader</p>
            <h1 className="text-2xl font-semibold text-white">{lesson.titre}</h1>
          </div>
          <PrimitiveBadge tone="accent">{module.titre}</PrimitiveBadge>
        </div>

        <PrimitiveCard tone="glass" className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Progression de la leçon</p>
              <p className="text-sm font-semibold text-white">{progressPercent}%</p>
            </div>
            <div className="text-sm text-slate-400">{completed ? 'Sauvegardé' : 'En cours de lecture'}</div>
          </div>
        </PrimitiveCard>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.article initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
            <PrimitiveCard tone="raised" className="p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Contenu</p>
              <div className="mt-4 space-y-4 text-sm leading-8 text-slate-300">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </PrimitiveCard>

            <PrimitiveCard tone="glass" className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Conseils</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">Révisez le concept principal, puis tentez l’exercice associé pour consolider votre compréhension.</p>
                </div>
                <PrimitiveBadge tone="neutral">Auto-save actif</PrimitiveBadge>
              </div>
            </PrimitiveCard>
          </motion.article>

          <aside className="space-y-4">
            <PrimitiveCard tone="glass" className="p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Plan du module</p>
              <div className="mt-4 space-y-2">
                {lessons.map((entry, index) => (
                  <Link key={entry.id} href={`/modules/${module.id}/lesson/${entry.id}`} className={`block rounded-[1rem] border px-3 py-2 text-sm transition ${entry.id === lesson.id ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-400/20 hover:text-white'}`}>
                    <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-500">0{index + 1}</span>
                    <span className="mt-1 block font-medium">{entry.titre}</span>
                  </Link>
                ))}
              </div>
            </PrimitiveCard>

            <PrimitiveCard tone="raised" className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Navigation</p>
                <PrimitiveBadge tone="neutral">{completed ? 'Terminé' : 'À suivre'}</PrimitiveBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {previousLesson ? (
                  <Link href={`/modules/${module.id}/lesson/${previousLesson.id}`} className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:text-white">Précédent</Link>
                ) : null}
                {nextLesson ? (
                  <Link href={`/modules/${module.id}/lesson/${nextLesson.id}`} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/40">Suivant</Link>
                ) : null}
              </div>
            </PrimitiveCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
