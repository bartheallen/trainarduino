'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircleIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ModuleNodeProps {
  title: string;
  state: 'locked' | 'available' | 'completed';
  active?: boolean;
  onClick?: () => void;
}

export function ModuleNode({ title, state, active = false, onClick }: ModuleNodeProps) {
  const shouldReduceMotion = useReducedMotion();
  const baseClasses = 'relative flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-[0_0_24px_rgba(255,255,255,0.08)] transition-all duration-300';

  const stateClasses = {
    locked: 'border-slate-600/60 bg-slate-900/80 text-slate-500',
    available: 'border-cyan-400/50 bg-gradient-to-br from-cyan-500/90 to-blue-500/80 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.24)]',
    completed: 'border-emerald-400/70 bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-[0_0_30px_rgba(74,222,128,0.24)]',
  };

  const stateAnimation = shouldReduceMotion
    ? { opacity: 1, scale: 1 }
    : state === 'locked'
      ? { opacity: 1, scale: 1, y: [0, -1, 0] }
      : state === 'available'
        ? { opacity: 1, scale: [1, 1.035, 1], boxShadow: ['0 0 0 rgba(34,211,238,0.2)', '0 0 20px rgba(34,211,238,0.22)', '0 0 0 rgba(34,211,238,0.2)'] }
        : { opacity: 1, scale: [1, 1.025, 1], boxShadow: ['0 0 0 rgba(74,222,128,0.18)', '0 0 20px rgba(74,222,128,0.22)', '0 0 0 rgba(74,222,128,0.18)'] };

  const transitionConfig = shouldReduceMotion
    ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }
    : state === 'locked'
      ? { duration: 2.8, repeat: Infinity, ease: [0.22, 1, 0.36, 1] as const }
      : state === 'available'
        ? { duration: 1.7, repeat: Infinity, ease: [0.22, 1, 0.36, 1] as const }
        : { duration: 2.2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.05, y: -2 }}
      onClick={onClick}
      className={`${baseClasses} ${stateClasses[state]} ${active ? 'ring-4 ring-cyan-300/40' : ''}`}
      aria-label={title}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={stateAnimation}
      transition={transitionConfig}
    >
      {state === 'locked' && <LockClosedIcon className="h-7 w-7" />}
      {state === 'available' && <SparklesIcon className="h-7 w-7" />}
      {state === 'completed' && <CheckCircleIcon className="h-7 w-7" />}
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-cyan-300/70"
          animate={shouldReduceMotion ? undefined : { scale: [1, 1.16, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}
