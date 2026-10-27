'use client';

import { motion } from 'framer-motion';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { CircuitChipIcon, LedIndicator, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';
import { useDictionary } from '@/components/i18n/LocaleProvider';

export function LandingPageSections() {
  const dict = useDictionary();

  const trustItems = [
    { title: dict.home.guidedPath, body: dict.home.guidedPathBody, icon: CircuitChipIcon },
    { title: dict.home.liveSimulation, body: dict.home.liveSimulationBody, icon: SignalWaveIcon },
    { title: dict.home.mentorAi, body: dict.home.mentorAiBody, icon: LedIndicator },
  ];

  const features = [
    {
      title: dict.home.curiosityToElectronics,
      body: dict.home.curiosityToElectronicsBody,
      metric: '94% de complétion',
    },
    {
      title: dict.home.precisionLearning,
      body: dict.home.precisionLearningBody,
      metric: '12 modules',
    },
    {
      title: dict.home.workEnvironment,
      body: dict.home.workEnvironmentBody,
      metric: 'Retour 24/7',
    },
  ];

  const stats = [
    { value: '120+', label: dict.home.exercises },
    { value: '8,9/10', label: dict.home.clarityScore },
    { value: '94%', label: dict.home.completion },
  ];

  return (
    <div className="relative z-10 w-full space-y-8 px-2 pb-20 sm:px-6 lg:px-8">
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.5 }} className="mx-auto w-full max-w-7xl">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <PrimitiveCard tone="glass" className="landing-glass-card landing-glass-card--large min-w-0 p-6 sm:p-8">
          <PrimitiveBadge tone="accent">{dict.home.engineeringLanguage}</PrimitiveBadge>
          <h2 className="mt-5 break-words text-2xl font-semibold text-white sm:text-4xl">{dict.home.precisionInteractions}</h2>
          <p className="mt-4 max-w-2xl break-words text-base text-slate-300 sm:text-lg">{dict.home.precisionInteractionsBody}</p>
        </PrimitiveCard>
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08, duration: 0.4 }}>
                <PrimitiveCard tone="raised" className="landing-glass-card landing-glass-card--small p-5 text-center">
                <p className="text-3xl font-semibold text-cyan-300">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </PrimitiveCard>
            </motion.div>
          ))}
        </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }} className="landing-glass-card landing-glass-card--large mx-auto w-full max-w-7xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-premium backdrop-blur-xl sm:p-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="min-w-0">
            <PrimitiveBadge tone="success">{dict.home.confidenceLevel}</PrimitiveBadge>
            <h2 className="mt-4 break-words text-2xl font-semibold text-white sm:text-4xl">{dict.home.premiumPath}</h2>
            <p className="mt-4 break-words text-base text-slate-300 sm:text-lg">{dict.home.premiumPathBody}</p>
          </div>
          <div className="w-full space-y-4">
            {trustItems.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08, duration: 0.35 }}>
                <PrimitiveCard tone="interactive" className="landing-glass-card landing-glass-card--small min-w-0 p-5">
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
            <PrimitiveCard tone={index % 2 === 0 ? 'raised' : 'glass'} className="landing-glass-card landing-glass-card--large min-w-0 p-6 sm:p-8">
              <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="min-w-0">
                  <PrimitiveBadge tone="accent">{feature.metric}</PrimitiveBadge>
                  <h3 className="mt-4 break-words text-xl font-semibold text-white sm:text-2xl">{feature.title}</h3>
                  <p className="mt-3 break-words text-base text-slate-300 sm:text-lg">{feature.body}</p>
                </div>
                <div className="landing-glass-card landing-glass-card--small min-w-0 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span className="break-words">{dict.home.learningSignal}</span>
                    <span className="shrink-0 text-cyan-300">{dict.home.active}</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>{dict.home.flowClarity}</span>
                        <span>82%</span>
                      </div>
                      <PrimitiveProgress value={82} animated={false} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>{dict.home.signalStability}</span>
                        <span>91%</span>
                      </div>
                      <PrimitiveProgress value={91} animated={false} />
                    </div>
                  </div>
                </div>
              </div>
            </PrimitiveCard>
          </motion.div>
        ))}
      </section>

      <motion.footer initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="landing-glass-footer mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/10 px-2 py-8 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-words">{dict.home.footer}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{dict.home.designedForClarity}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{dict.home.premiumMotion}</span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">{dict.home.model3D}</span>
        </div>
      </motion.footer>
    </div>
  );
}
