'use client';

import Image from 'next/image';
import { useState, type ReactElement } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

interface LessonReaderStepProps {
  lessons: Array<{
    id: number;
    titre: string;
    contenu: string;
    image_url?: string | null;
  }>;
  onComplete: () => void;
}

function renderLessonContent(content: string) {
  const lines = content.split('\n');
  const elements: Array<ReactElement> = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${index}`} className="mt-4 text-base font-semibold text-white">{trimmed.replace(/^##\s*/, '')}</h2>);
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${index}`} className="mt-2 text-lg font-semibold text-cyan-200">{trimmed.replace(/^#\s*/, '')}</h1>);
      return;
    }

    if (trimmed.startsWith('- ')) {
      elements.push(<li key={`li-${index}`} className="ml-5 list-disc text-slate-300">{trimmed.replace(/^-\s*/, '')}</li>);
      return;
    }

    elements.push(<p key={`p-${index}`} className="leading-7 text-slate-300">{trimmed}</p>);
  });

  return elements;
}

export function LessonReaderStep({ lessons, onComplete }: LessonReaderStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (lessons.length === 0) {
    return null;
  }

  const currentLesson = lessons[currentIndex];
  const isLastLesson = currentIndex === lessons.length - 1;
  const progressPercent = Math.round(((currentIndex + 1) / lessons.length) * 100);

  function handleNext() {
    if (isLastLesson) {
      onComplete();
      return;
    }

    setCurrentIndex((value) => Math.min(value + 1, lessons.length - 1));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Étape 1 • Lecture obligatoire</p>
          <p className="mt-1 text-sm text-slate-400">Prenez le temps de lire les leçons du module avant d’aborder le tutorat.</p>
        </div>
        <PrimitiveBadge tone="accent">Leçon {currentIndex + 1}/{lessons.length}</PrimitiveBadge>
      </div>

      <PrimitiveCard tone="glass" className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Contenu</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{currentLesson.titre}</h3>
          </div>
          <PrimitiveBadge tone="neutral">{progressPercent}%</PrimitiveBadge>
        </div>

        {currentLesson.image_url ? (
          <div className="mx-auto mt-4 mb-4 max-w-md overflow-hidden rounded-[1rem] border border-white/10 bg-slate-950/60">
            <Image
              src={currentLesson.image_url}
              alt={currentLesson.titre}
              width={800}
              height={450}
              className="h-auto w-full object-contain"
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">
          {renderLessonContent(currentLesson.contenu)}
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-400/80 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full border border-cyan-400/25 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20"
          >
            {isLastLesson ? 'J’ai compris, continuer →' : 'Leçon suivante'}
          </button>
        </div>
      </PrimitiveCard>
    </div>
  );
}
