'use client';

import { useEffect, useState } from 'react';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { useDictionary } from '@/components/i18n/LocaleProvider';

interface OnboardingTourProps {
  open?: boolean;
  onClose?: () => void;
}

// Versioning lets existing learners receive an improved tour once, while keeping it one-time per device.
export const ONBOARDING_STORAGE_KEY = 'trainarduino_onboarding_seen_v2';

export function OnboardingTour({ open = true, onClose }: OnboardingTourProps) {
  const dict = useDictionary();
  const steps = [
    { title: dict.onboarding.welcomeTitle, body: dict.onboarding.welcomeBody },
    { title: dict.onboarding.lessonsTitle, body: dict.onboarding.lessonsBody },
    { title: dict.onboarding.questionsTitle, body: dict.onboarding.questionsBody },
    { title: dict.onboarding.codeTitle, body: dict.onboarding.codeBody },
    { title: dict.onboarding.circuitTitle, body: dict.onboarding.circuitBody },
  ];
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
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{dict.onboarding.guideTitle}</p>
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
              {dict.onboarding.skip}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-cyan-400/25 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20"
            >
              {isLastStep ? dict.onboarding.finish : dict.onboarding.next}
            </button>
          </div>
        </div>
      </PrimitiveCard>
    </div>
  );
}
