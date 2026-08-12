'use client';

import { useEffect, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

interface OnboardingTourProps {
  open?: boolean;
  onClose?: () => void;
}

const steps = [
  {
    title: 'Bienvenue !',
    body: 'Voici votre tableau de bord, où vous retrouvez tous vos modules et votre progression.',
  },
  {
    title: 'Lire les leçons d’abord',
    body: 'Chaque module commence par des leçons à lire : elles posent les bases pour comprendre avant de passer aux questions.',
  },
  {
    title: 'Questions guidées',
    body: 'Ensuite, des questions vous guident pas à pas, avec une correction par IA pour valider votre compréhension.',
  },
  {
    title: 'Écrire votre code',
    body: 'Vous pouvez ensuite rédiger votre propre solution, puis recevoir une correction utile de l’IA.',
  },
  {
    title: 'Tester votre circuit',
    body: 'Enfin, vérifiez votre circuit dans le simulateur Wokwi avant de passer au module suivant.',
  },
];

const STORAGE_KEY = 'trainarduino_onboarding_seen';

export function OnboardingTour({ open = true, onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  if (!isOpen) {
    return null;
  }

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function markSeen() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
  }

  function closeTour() {
    markSeen();
    setIsOpen(false);
    onClose?.();
  }

  function handleNext() {
    if (isLastStep) {
      closeTour();
      return;
    }

    setStepIndex((value) => value + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <PrimitiveCard tone="floating" className="w-full max-w-xl border-cyan-400/20 p-0">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Guide de démarrage</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{currentStep.title}</h2>
            </div>
            <PrimitiveBadge tone="accent">{stepIndex + 1}/{steps.length}</PrimitiveBadge>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm leading-8 text-slate-300">{currentStep.body}</p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeTour}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Passer
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-cyan-400/25 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20"
            >
              {isLastStep ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </PrimitiveCard>
    </div>
  );
}
