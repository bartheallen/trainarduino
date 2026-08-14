'use client';

import { motion } from 'framer-motion';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { CircuitChipIcon, LedIndicator, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';

const trustItems = [
  { title: 'Parcours guidé', body: 'Une progression précise du premier clignotement jusqu’aux systèmes avancés.', icon: CircuitChipIcon },
  { title: 'Simulation en direct', body: 'Prototypez dans le même espace où vous apprenez.', icon: SignalWaveIcon },
  { title: 'Mentor IA', body: 'Recevez des retours utiles, clairs et immédiats.', icon: LedIndicator },
];

const features = [
  {
    title: 'De la curiosité à l’électronique',
    body: 'Chaque leçon est pensée comme une expérience maîtrisée : calme, concentrée et gratifiante.',
    metric: '94 % de complétion',
  },
  {
    title: 'Apprentissage construit avec précision',
    body: 'La progression est visible, bien cadrée et intentionnelle, sans bruit ni distraction.',
    metric: '12 modules',
  },
  {
    title: 'Un environnement qui travaille avec vous',
    body: 'La plateforme s’adapte à votre travail pour garder une expérience fluide et élégante.',
    metric: 'Retour 24/7',
  },
];

const stats = [
  { value: '120+', label: 'Exercices' },
  { value: '8,9/10', label: 'Score de clarté' },
  { value: '94%', label: 'Achèvement' },
];

export function LandingPageSections() {
  return (
    <div className="relative z-10 w-full space-y-8 px-2 pb-20 sm:px-6 lg:px-8">
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.5 }} className="mx-auto w-full max-w-7xl">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PrimitiveCard tone="glass" className="min-w-0 p-6 sm:p-8">
          <PrimitiveBadge tone="accent">Langage de l’ingénierie</PrimitiveBadge>
          <h2 className="mt-5 break-words text-2xl font-semibold text-white sm:text-4xl">Chaque interaction est pensée avec précision.</h2>
          <p className="mt-4 max-w-2xl break-words text-base text-slate-300 sm:text-lg">TrainArduino transforme l’électronique complexe en une expérience calme, guidée et visiblement progressives.</p>
        </PrimitiveCard>
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08, duration: 0.4 }}>
                <PrimitiveCard tone="raised" className="p-5 text-center">
                <p className="text-3xl font-semibold text-cyan-300">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </PrimitiveCard>
            </motion.div>
          ))}
        </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }} className="mx-auto w-full max-w-7xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-premium backdrop-blur-xl sm:p-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="min-w-0">
            <PrimitiveBadge tone="success">Niveau de confiance</PrimitiveBadge>
            <h2 className="mt-4 break-words text-2xl font-semibold text-white sm:text-4xl">Un parcours premium pensé pour la concentration.</h2>
            <p className="mt-4 break-words text-base text-slate-300 sm:text-lg">Conçu comme une expérience cohérente : apprentissage, simulation et retours restent clairs du premier clic au dernier jalon.</p>
          </div>
          <div className="w-full space-y-4">
            {trustItems.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08, duration: 0.35 }}>
                <PrimitiveCard tone="interactive" className="min-w-0 p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-1 shrink-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                      {item.icon === LedIndicator ? <LedIndicator className="h-3 w-3" /> : item.icon === SignalWaveIcon ? <SignalWaveIcon className="h-5 w-5" /> : <CircuitChipIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 break-words text-sm text-slate-400">{item.body}</p>
                    </div>
                  </div>
                </PrimitiveCard>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="mx-auto w-full max-w-7xl space-y-6">
        {features.map((feature, index) => (
          <motion.div key={feature.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: index * 0.05 }}>
            <PrimitiveCard tone={index % 2 === 0 ? 'raised' : 'glass'} className="min-w-0 p-6 sm:p-8">
              <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="min-w-0">
                  <PrimitiveBadge tone="accent">{feature.metric}</PrimitiveBadge>
                  <h3 className="mt-4 break-words text-xl font-semibold text-white sm:text-2xl">{feature.title}</h3>
                  <p className="mt-3 break-words text-base text-slate-300 sm:text-lg">{feature.body}</p>
                </div>
                <div className="min-w-0 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                    <span className="break-words">Signal d’apprentissage</span>
                    <span className="shrink-0 text-cyan-300">Actif</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>Clarté du flux</span>
                        <span>82%</span>
                      </div>
                      <PrimitiveProgress value={82} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>Stabilité du signal</span>
                        <span>91%</span>
                      </div>
                      <PrimitiveProgress value={91} />
                    </div>
                  </div>
                </div>
              </div>
            </PrimitiveCard>
          </motion.div>
        ))}
      </section>

      <motion.footer initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/10 px-2 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-words">TrainArduino — un apprentissage conçu pour les créateurs de demain.</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Conçu pour la clarté</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Mouvement premium</span>
        </div>
      </motion.footer>
    </div>
  );
}
