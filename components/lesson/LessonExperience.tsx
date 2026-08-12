'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { Button } from '@/components/ui/Button';
import { CircuitChipIcon, LedIndicator, OscilloscopeDivider, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';

interface LessonExperienceProps {
  module: {
    id: number;
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
  };
  lessons: Array<{
    id: number;
    titre: string;
    contenu: string;
  }>;
  exercises: Array<{
    id: number;
    titre: string;
    enonce: string;
    difficulte: string;
    xp_recompense: number;
  }>;
}

const calloutStyles = {
  tip: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  note: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
};

export function LessonExperience({ module, lessons, exercises }: LessonExperienceProps) {
  const shouldReduceMotion = useReducedMotion();
  const readingMinutes = Math.max(5, lessons.length * 4 + 3);
  const xpReward = lessons.length * 75 + 120;
  const progress = Math.min(92, 24 + module.ordre * 8);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-white">
          <span aria-hidden>↺</span>
          Retour au dashboard
        </Link>
        <PrimitiveBadge tone="accent">Laboratoire de cours</PrimitiveBadge>
      </div>

      <motion.header
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.13),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_30%)]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
                <CircuitChipIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Module #{module.ordre}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{module.titre}</h1>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{module.description}</p>
            <OscilloscopeDivider />
            <div className="flex flex-wrap gap-3">
              <PrimitiveBadge tone="success">{readingMinutes} min de lecture</PrimitiveBadge>
              <PrimitiveBadge tone="accent">+{xpReward} XP</PrimitiveBadge>
              <PrimitiveBadge tone="neutral">Niveau {module.palier_test}</PrimitiveBadge>
            </div>
          </div>

          <PrimitiveCard tone="glass" className="p-5">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Progression du module</span>
              <span className="text-cyan-300">{progress}%</span>
            </div>
            <div className="mt-4">
              <PrimitiveProgress value={progress} />
            </div>
            <div className="mt-5 rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
                <span>Signal de progression</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Chaque section révèle un nouvel élément de compréhension, comme un chemin de signal parfaitement routé.</p>
            </div>
          </PrimitiveCard>
        </div>
      </motion.header>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <PrimitiveCard tone="glass" className="p-5">
            <div className="flex items-center gap-2">
              <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Sommaire</p>
            </div>
            <div className="mt-4 space-y-3">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Section {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{lesson.titre}</p>
                </div>
              ))}
            </div>
          </PrimitiveCard>

          <PrimitiveCard tone="raised" className="p-5">
            <div className="flex items-center gap-2">
              <LedIndicator className="shrink-0" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Récompenses</p>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">Badge de compréhension • à débloquer</div>
              <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">Exercice bonus • disponible après la lecture</div>
            </div>
          </PrimitiveCard>
        </aside>

        <div className="space-y-6">
          {lessons.map((lesson, index) => {
            const calloutKey = index % 3 === 0 ? 'tip' : index % 3 === 1 ? 'note' : 'warning';
            const callout = {
              tip: { title: 'Astuce', body: 'Gardez l’architecture logique claire avant de brancher les composants.' },
              note: { title: 'Note d’ingénierie', body: 'Un signal stable commence toujours par une lecture précise du schéma.' },
              warning: { title: 'Erreur fréquente', body: 'Évitez les connexions trop denses quand la tension doit rester propre.' },
            }[calloutKey];

            const paragraphs = lesson.contenu.split('\n').filter(Boolean);

            return (
              <motion.section key={lesson.id} initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} whileInView={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
                <PrimitiveCard tone="floating" className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Leçon {index + 1}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.titre}</h2>
                    </div>
                    <PrimitiveBadge tone="neutral">{readingMinutes - index} min</PrimitiveBadge>
                  </div>

                  <div className="mt-6 space-y-4 text-base leading-8 text-slate-300">
                    {paragraphs.slice(0, 3).map((paragraph, paragraphIndex) => (
                      <p key={`${lesson.id}-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                  </div>

                  <div className={`mt-6 rounded-[1.15rem] border p-4 ${calloutStyles[calloutKey]}`}>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em]">{callout.title}</p>
                    <p className="mt-2 text-sm leading-7">{callout.body}</p>
                  </div>

                  <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Exemple de code</p>
                        <p className="mt-1 text-sm text-slate-500">Prévisualisation du laboratoire</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10">Copier</button>
                        <button type="button" className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20">Exécuter</button>
                      </div>
                    </div>
                    <pre className="mt-4 overflow-hidden rounded-[1rem] border border-white/10 bg-black/50 p-4 text-sm leading-7 text-slate-300">
                      <code>{`void setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n}`}</code>
                    </pre>
                  </div>
                </PrimitiveCard>
              </motion.section>
            );
          })}

          <PrimitiveCard tone="glass" className="p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Fin de séquence</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Compétences acquises</h2>
              </div>
              <PrimitiveBadge tone="success">Mission terminée</PrimitiveBadge>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm font-semibold text-white">Ce que vous avez exploré</p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-400">
                  <li>• Structure logique d’un circuit</li>
                  <li>• Lecture d’un schéma de signal</li>
                  <li>• Compréhension de la progression d’un module</li>
                </ul>
              </div>
              <div className="rounded-[1.15rem] border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-semibold text-cyan-200">Récompense</p>
                <p className="mt-2 text-3xl font-semibold text-white">+{xpReward} XP</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Le prochain module s’ouvre dès que vous êtes prêt à continuer.</p>
                <Button className="mt-4">Passer au module suivant</Button>
              </div>
            </div>
          </PrimitiveCard>

          <PrimitiveCard tone="raised" className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Exercices</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pratique de laboratoire</h2>
              </div>
              <PrimitiveBadge tone="accent">{exercises.length} exercice(s)</PrimitiveBadge>
            </div>
            <div className="mt-5 space-y-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="rounded-[1.15rem] border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{exercise.titre}</p>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{exercise.difficulte}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{exercise.enonce}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>Récompense : {exercise.xp_recompense} XP</span>
                    <span className="font-semibold text-cyan-300">À lancer</span>
                  </div>
                </div>
              ))}
            </div>
          </PrimitiveCard>
        </div>
      </div>
    </div>
  );
}
