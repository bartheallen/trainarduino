'use client';

import type { FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { XpBar } from '@/components/gamification/XpBar';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ModulePath } from '@/components/dashboard/ModulePath';
import { Button } from '@/components/ui/Button';
import { CircuitChipIcon, LedIndicator, OscilloscopeDivider, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';
import { submitRecommendationFeedbackAction } from '@/lib/recommendationServerActions';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

import type { AdaptiveRecommendation } from '@/lib/services/adaptiveEngineService';

interface DashboardExperienceProps {
  profile: {
    username: string;
    niveau_actuel: number;
    xp_total: number;
    streak?: number | null;
  };
  progressPercentage: number;
  completedCount: number;
  totalModules: number;
  currentThreshold: number;
  nextThreshold: number;
  moduleStatus: Array<{
    id: number;
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
    status: string;
  }>;
  adaptiveRecommendation?: AdaptiveRecommendation;
}

export function DashboardExperience({
  profile,
  progressPercentage,
  completedCount,
  totalModules,
  currentThreshold,
  nextThreshold,
  moduleStatus,
  adaptiveRecommendation,
}: DashboardExperienceProps) {
  const shouldReduceMotion = useReducedMotion();

  const stats = [
    { label: 'Modules', value: `${completedCount}/${totalModules}`, hint: 'terminés' },
    { label: 'Niveau', value: `Lv ${profile.niveau_actuel}`, hint: 'actuel' },
    { label: 'XP', value: `${profile.xp_total}`, hint: 'total' },
    { label: 'Prochain', value: `${Math.max(0, nextThreshold - profile.xp_total)} XP`, hint: 'à gagner' },
  ];

  const achievements = [
    { title: 'Premier Blink', detail: 'Allumer une LED', earned: true },
    { title: 'Circuit fluide', detail: 'Compléter 3 modules', earned: false },
    { title: 'Signal stable', detail: 'Obtenir 80%+ sur un exercice', earned: false },
  ];

  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const activityItems = [
    { title: 'Mission lancée', body: 'La séquence de progression est prête à être suivie.', time: 'À l’instant' },
    { title: 'Progression mise à jour', body: `${completedCount} module${completedCount > 1 ? 's' : ''} déjà validé${completedCount > 1 ? 's' : ''}.`, time: 'Aujourd’hui' },
    { title: 'Récompense à portée', body: 'Un nouveau badge devient accessible à la prochaine étape.', time: 'À suivre' },
  ];

  const missionProgress = Math.min(100, Math.max(0, progressPercentage));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const seen = window.localStorage.getItem('trainarduino_onboarding_seen');
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  async function handleSubmitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adaptiveRecommendation) {
      setFeedbackError('Impossible d\'enregistrer le feedback sans recommandation.');
      return;
    }

    setFeedbackSaving(true);
    setFeedbackError(null);
    setFeedbackSaved(false);

    try {
      await submitRecommendationFeedbackAction(adaptiveRecommendation.userId, feedbackText, rating);
      setFeedbackSaved(true);
      setFeedbackText('');
      setRating(null);
    } catch (error) {
      console.error('Failed to submit recommendation feedback', error);
      setFeedbackError('Impossible d’envoyer votre avis pour le moment.');
    } finally {
      setFeedbackSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 max-w-full flex-col gap-6 overflow-hidden px-0 sm:px-1">
      <motion.header
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative min-w-0 overflow-hidden rounded-[2.2rem] border border-white/10 bg-slate-900/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.13),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%)]" />
        <div className="relative z-10 flex min-w-0 flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.14)]">
                <CircuitChipIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <PrimitiveBadge tone="accent">Mission Control</PrimitiveBadge>
                <h1 className="mt-2 break-words text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                  Bonjour, <span className="text-cyan-300">{profile.username}</span>
                </h1>
              </div>
            </div>

            <p className="mt-5 max-w-2xl break-words text-lg text-slate-300">
              Votre parcours Arduino se déroule comme un circuit de précision : chaque module révèle une nouvelle étape, chaque progression éclaire le prochain challenge.
            </p>

            <OscilloscopeDivider />

            <div className="flex flex-wrap items-center gap-3">
              <StreakFlame streak={profile.streak ?? 0} />
              <Button variant="secondary">Paramètres</Button>
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/15"
              >
                ? Aide
              </button>
            </div>
          </div>

          <PrimitiveCard tone="glass" className="w-full min-w-0 max-w-md p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Mission active</p>
                <h2 className="mt-2 break-words text-2xl font-semibold text-white">Maîtriser la logique du circuit</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <LedIndicator className="shrink-0" />
                En cours
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Durée estimée</span>
                  <span className="text-slate-200">20 min</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>Difficulté</span>
                  <span className="text-cyan-300">Intermédiaire</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>Récompense</span>
                  <span className="text-emerald-300">+150 XP</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>Progression</span>
                  <span>{missionProgress}%</span>
                </div>
                <PrimitiveProgress value={missionProgress} />
              </div>
            </div>
          </PrimitiveCard>
        </div>
      </motion.header>

      {showOnboarding && <OnboardingTour open={showOnboarding} onClose={() => setShowOnboarding(false)} />}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 * index }} whileHover={{ y: -4, scale: 1.01 }}>
            <PrimitiveCard tone="glass" className="p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.hint}</p>
            </PrimitiveCard>
          </motion.div>
        ))}
      </section>

      <section id="parcours-modules" className="scroll-mt-24 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PrimitiveCard tone="floating" className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Parcours de progression</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Un chemin de modules à la fois lumineux et structuré</h2>
              </div>
              <PrimitiveBadge tone="success">Module courant</PrimitiveBadge>
            </div>
          </div>
          <div className="p-6">
            <ModulePath modules={moduleStatus} />
          </div>
        </PrimitiveCard>

        <div className="space-y-6">
          <PrimitiveCard tone="glass" className="p-6">
            <div className="flex items-center gap-2">
              <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Récompense à venir</p>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-white">Badge de précision</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Les modules complétés allument progressivement les récompenses. Chaque avancée rend cette expérience plus élégante et plus motivante.
            </p>
            <div className="mt-5 rounded-[1.1rem] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">
              Prochaine récompense : <span className="font-semibold text-white">Signal stable</span>
            </div>
          </PrimitiveCard>

          <PrimitiveCard tone="raised" className="p-6">
            <div className="flex items-center gap-2">
              <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Badges</p>
            </div>
            <div className="mt-4 space-y-3">
              {achievements.map((achievement) => (
                <motion.div key={achievement.title} whileHover={{ y: -2, scale: 1.005 }} className={`rounded-[1.05rem] border p-3 ${achievement.earned ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-slate-950/70 text-slate-300'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{achievement.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{achievement.detail}</p>
                    </div>
                    {achievement.earned ? <LedIndicator className="shrink-0" /> : <div className="h-2.5 w-2.5 rounded-full bg-slate-600" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </PrimitiveCard>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <PrimitiveCard tone="glass" className="p-6">
            <div className="flex items-center gap-2">
              <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">XP central</p>
            </div>
            <div className="mt-6">
              <XpBar currentXp={profile.xp_total} currentThreshold={currentThreshold} nextThreshold={nextThreshold} currentLevel={profile.niveau_actuel} />
            </div>
          </PrimitiveCard>

          {adaptiveRecommendation && (
            <PrimitiveCard tone="glass" className="p-6">
              <div className="flex items-center gap-2">
                <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Suggestion adaptative</p>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{adaptiveRecommendation.suggestedModuleTitle ?? 'Recommandation personnalisée'}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{adaptiveRecommendation.explanation}</p>
              <div className="mt-6 rounded-[1.1rem] border border-cyan-400/20 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Type</p>
                <p className="mt-1">{adaptiveRecommendation.recommendedContentType}</p>
                <p className="mt-3 font-semibold text-white">Action recommandée</p>
                <p className="mt-1">{adaptiveRecommendation.recommendedAction}</p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="mt-6 space-y-4 rounded-[1.1rem] border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Votre avis</p>
                <p className="text-slate-500">Aidez-nous à améliorer votre prochaine recommandation.</p>

                <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <label htmlFor="feedback" className="text-slate-300">Commentaire</label>
                  <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder="Ce qui vous a aidé ou ce qui pourrait être mieux"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <span className="text-slate-300">Note</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`rounded-full border px-3 py-1 text-sm transition ${rating === value ? 'border-cyan-400 bg-cyan-400/15 text-white' : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-cyan-300'}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {feedbackError && <p className="text-sm text-rose-300">{feedbackError}</p>}
                {feedbackSaved && <p className="text-sm text-emerald-300">Merci ! Votre avis a bien été enregistré.</p>}

                <Button type="submit" variant="secondary" className="w-full" disabled={feedbackSaving}>
                  {feedbackSaving ? 'Envoi...' : 'Envoyer mon avis'}
                </Button>
              </form>
            </PrimitiveCard>
          )}
        </div>

        <PrimitiveCard tone="raised" className="p-6">
          <div className="flex items-center gap-2">
            <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Activité récente</p>
          </div>
          <div className="mt-5 space-y-4">
            {activityItems.map((item, index) => (
              <motion.div key={item.title} initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }} animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 * index }} className="flex gap-3 rounded-[1.05rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <LedIndicator className="shrink-0" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.time}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </PrimitiveCard>
      </section>
    </div>
  );
}
