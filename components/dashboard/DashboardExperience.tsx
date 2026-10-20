'use client';

import type { FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { XpBar } from '@/components/gamification/XpBar';
import { ModulePreview } from '@/components/dashboard/ModulePreview';
import { Button } from '@/components/ui/Button';
import { CircuitChipIcon, LedIndicator, OscilloscopeDivider, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';
import { submitRecommendationFeedbackAction } from '@/lib/recommendationServerActions';
import { OnboardingTour, ONBOARDING_STORAGE_KEY } from '@/components/onboarding/OnboardingTour';
import { useDictionary } from '@/components/i18n/LocaleProvider';
import Link from 'next/link';

import type { AdaptiveRecommendation } from '@/lib/services/adaptiveEngineService';

function format(str: string, vars: Record<string, string | number>) {
  return str.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
}

function translateLevel(levelName: string, dict: ReturnType<typeof useDictionary>) {
  const levels: Record<string, string> = {
    Débutant: dict.common.levelBeginner,
    Apprenti: dict.common.levelApprentice,
    Intermédiaire: dict.common.levelIntermediate,
    Avancé: dict.common.levelAdvanced,
    Expert: dict.common.levelExpert,
  };
  return levels[levelName] ?? levelName;
}

function translateRecommendation(value: string, dict: ReturnType<typeof useDictionary>, kind: 'action' | 'content' | 'explanation') {
  const translations = kind === 'action'
    ? {
        review: dict.dashboard.actionReview,
        practice: dict.dashboard.actionPractice,
        challenge: dict.dashboard.actionChallenge,
        project: dict.dashboard.actionProject,
        unlock: dict.dashboard.actionUnlock,
        quiz: dict.dashboard.actionQuiz,
      }
    : kind === 'content'
      ? {
          exercise: dict.dashboard.contentExercise,
          quiz: dict.dashboard.contentQuiz,
          project: dict.dashboard.contentProject,
          review: dict.dashboard.contentReview,
        }
      : {
          'Le système utilise votre progression récente et votre profil pédagogique pour ajuster la prochaine étape.': dict.dashboard.recommendationDefaultExplanation,
          'Vos résultats récents montrent des concepts faibles et une santé de connaissances à renforcer.': dict.dashboard.recommendationReviewExplanation,
          'Vous êtes prêt pour un défi plus exigeant et transversal.': dict.dashboard.recommendationChallengeExplanation,
          'Votre progression est solide, un mini-projet permet de synthétiser les notions.': dict.dashboard.recommendationProjectExplanation,
          'Continuez avec des exercices ciblés pour consolider vos connaissances.': dict.dashboard.recommendationPracticeExplanation,
        };
  return translations[value as keyof typeof translations] ?? value;
}

interface DashboardExperienceProps {
  profile: {
    username: string;
    niveau_actuel: number;
    xp_total: number;
    evolutionLevelName: string;
    placementLevelName: string;
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
  const dict = useDictionary();
  const shouldReduceMotion = useReducedMotion();

  const stats = [
    { label: dict.dashboard.statModules, value: `${completedCount}/${totalModules}`, hint: dict.dashboard.completedHint },
    { label: dict.dashboard.evolutionaryLevel, value: translateLevel(profile.evolutionLevelName, dict), hint: format(dict.dashboard.levelThreshold, { level: profile.niveau_actuel }) },
    { label: dict.dashboard.xp, value: `${profile.xp_total}`, hint: dict.dashboard.totalHint },
    { label: dict.dashboard.next, value: `${Math.max(0, nextThreshold - profile.xp_total)} XP`, hint: dict.dashboard.toEarn },
  ];

  const achievements = [
    { title: dict.dashboard.achievementFirstBlink, detail: dict.dashboard.achievementFirstBlinkDetail, earned: true },
    { title: dict.dashboard.achievementSmoothCircuit, detail: dict.dashboard.achievementSmoothCircuitDetail, earned: false },
    { title: dict.dashboard.achievementStableSignal, detail: dict.dashboard.achievementStableSignalDetail, earned: false },
  ];

  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const activityItems = [
    { title: dict.dashboard.missionLaunched, body: dict.dashboard.missionLaunchedBody, time: dict.dashboard.justNow },
    { title: dict.dashboard.progressUpdated, body: format(completedCount === 1 ? dict.dashboard.activityProgressOne : dict.dashboard.activityProgressMany, { count: completedCount }), time: dict.dashboard.today },
    { title: dict.dashboard.rewardWithinReach, body: dict.dashboard.rewardWithinReachBody, time: dict.dashboard.comingUp },
  ];

  const missionProgress = Math.min(100, Math.max(0, progressPercentage));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const seen = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  async function handleSubmitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adaptiveRecommendation) {
      setFeedbackError(dict.dashboard.feedbackWithoutRecommendation);
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
      setFeedbackError(dict.dashboard.feedbackSendError);
    } finally {
      setFeedbackSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6 px-0 sm:px-1">
      <motion.header
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative min-w-0 overflow-hidden rounded-[2.2rem] border border-white/10 bg-slate-900/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.13),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%)]" />
        <div className="relative z-10 flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.14)]">
                <CircuitChipIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <PrimitiveBadge tone="accent">{dict.dashboard.missionControl}</PrimitiveBadge>
                <h1 className="mt-2 break-words text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  {dict.dashboard.greeting} <span className="text-cyan-300">{profile.username}</span>
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl break-words text-base text-slate-300">
              {dict.dashboard.journeyIntro}
            </p>

            <OscilloscopeDivider />

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/settings" className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/10">{dict.dashboard.settingsLink}</Link>
              <Link href="/modules" className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15">{dict.dashboard.myModules}</Link>
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/15"
              >
                {dict.dashboard.help}
              </button>
            </div>
          </div>

          <PrimitiveCard tone="glass" className="w-full min-w-0 max-w-md p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{dict.dashboard.activeMission}</p>
                <h2 className="mt-2 break-words text-xl font-semibold text-white">{dict.dashboard.missionTitle}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <LedIndicator className="shrink-0" />
                {dict.common.moduleInProgress}
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>{dict.dashboard.estimatedDuration}</span>
                  <span className="text-slate-200">{dict.dashboard.durationMinutes.replace('{minutes}', '20')}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>{dict.dashboard.difficulty}</span>
                  <span className="text-cyan-300">{dict.common.levelIntermediate}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                  <span>{dict.dashboard.reward}</span>
                  <span className="text-emerald-300">{format(dict.dashboard.missionReward, { xp: 150 })}</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{dict.dashboard.progress}</span>
                  <span>{missionProgress}%</span>
                </div>
                <PrimitiveProgress value={missionProgress} />
              </div>
            </div>
          </PrimitiveCard>
        </div>
      </motion.header>

      {showOnboarding && <OnboardingTour open={showOnboarding} onClose={() => setShowOnboarding(false)} />}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 * index }} whileHover={{ y: -4, scale: 1.01 }}>
            <PrimitiveCard tone="glass" className="p-4">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-400">{stat.hint}</p>
            </PrimitiveCard>
          </motion.div>
        ))}
      </section>

      <section id="parcours-modules" className="scroll-mt-24 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PrimitiveCard tone="floating" className="overflow-hidden p-0">
          <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.progressPath}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{dict.dashboard.yourPath}</h2>
              </div>
              <Link href="/modules" className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">{dict.dashboard.allModules.replace('{count}', String(totalModules))}</Link>
            </div>
          </div>
          <div className="p-5">
            <ModulePreview modules={moduleStatus} totalModules={totalModules} />
          </div>
        </PrimitiveCard>

        <div className="space-y-5">
          <PrimitiveCard tone="glass" className="p-5">
            <div className="flex items-center gap-2">
              <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.upcomingReward}</p>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{dict.dashboard.precisionBadge}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {dict.dashboard.completedModulesReward}
            </p>
            <div className="mt-5 rounded-[1.1rem] border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-200">
              {dict.dashboard.nextReward} <span className="font-semibold text-white">{dict.dashboard.achievementStableSignal}</span>
            </div>
          </PrimitiveCard>

          <PrimitiveCard tone="raised" className="p-5">
            <div className="flex items-center gap-2">
              <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.badges}</p>
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

      <section className="grid min-w-0 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0 space-y-6">
          <PrimitiveCard tone="glass" className="min-w-0 p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.xpCentral}</p>
            </div>
            <div className="mt-6">
              <XpBar currentXp={profile.xp_total} currentThreshold={currentThreshold} nextThreshold={nextThreshold} currentLevel={profile.niveau_actuel} levelName={profile.evolutionLevelName} />
              <p className="mt-3 text-sm text-slate-400">{format(dict.dashboard.startingLevelSentence, { level: translateLevel(profile.placementLevelName, dict) })}</p>
            </div>
          </PrimitiveCard>

          {adaptiveRecommendation && (
          <PrimitiveCard tone="glass" className="min-w-0 p-4 sm:p-6">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.adaptiveSuggestion}</p>
              </div>
              <h3 className="mt-4 break-words text-2xl font-semibold text-white">{adaptiveRecommendation.suggestedModuleTitle ?? dict.dashboard.personalizedRecommendation}</h3>
              <p className="mt-3 break-words text-sm leading-6 text-slate-400">{translateRecommendation(adaptiveRecommendation.explanation, dict, 'explanation')}</p>
              <div className="mt-6 rounded-[1.1rem] border border-cyan-400/20 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{dict.dashboard.recommendationType}</p>
                <p className="mt-1">{translateRecommendation(adaptiveRecommendation.recommendedContentType, dict, 'content')}</p>
                <p className="mt-3 font-semibold text-white">{dict.dashboard.recommendedAction}</p>
                <p className="mt-1">{translateRecommendation(adaptiveRecommendation.recommendedAction, dict, 'action')}</p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="mt-6 space-y-4 rounded-[1.1rem] border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{dict.dashboard.feedbackTitle}</p>
                <p className="text-slate-500">{dict.dashboard.feedbackPrompt}</p>

                <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <label htmlFor="feedback" className="text-slate-300">{dict.dashboard.comment}</label>
                  <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(event) => setFeedbackText(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder={dict.dashboard.feedbackPlaceholder}
                  />
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <span className="text-slate-300">{dict.dashboard.rating}</span>
                  <div className="flex flex-wrap items-center gap-2">
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
                {feedbackSaved && <p className="text-sm text-emerald-300">{dict.dashboard.feedbackThanks}</p>}

                <Button type="submit" variant="secondary" className="w-full" disabled={feedbackSaving}>
                  {feedbackSaving ? dict.dashboard.sending : dict.dashboard.sendFeedback}
                </Button>
              </form>
            </PrimitiveCard>
          )}
        </div>

        <PrimitiveCard tone="raised" className="min-w-0 p-4 sm:p-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">{dict.dashboard.recentActivity}</p>
          </div>
          <div className="mt-5 space-y-4">
            {activityItems.map((item, index) => (
              <motion.div key={item.title} initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }} animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.08 * index }} className="flex min-w-0 gap-3 rounded-[1.05rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                  <LedIndicator className="shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <p className="break-words font-semibold text-white">{item.title}</p>
                    <span className="break-words text-xs uppercase tracking-[0.18em] text-slate-500">{item.time}</span>
                  </div>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-400">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </PrimitiveCard>
      </section>
    </div>
  );
}
