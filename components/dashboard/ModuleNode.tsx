'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ModuleNodeProps {
  title: string;
  state: 'locked' | 'available' | 'completed';
  active?: boolean;
  onClick?: () => void;
}

/**
 * Interactive module node styled like a PCB component with three visual states.
 */
export function ModuleNode({ title, state, active = false, onClick }: ModuleNodeProps) {
  const baseClasses = 'relative flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-300';

  const stateClasses = {
    locked: 'border-slate-400 bg-slate-200 text-slate-500',
    available: 'border-copper-500 bg-copper-100 text-copper-700',
    completed: 'border-emerald-500 bg-emerald-500 text-white',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.05, y: -2 }}
      onClick={onClick}
      className={`${baseClasses} ${stateClasses[state]} ${active ? 'ring-4 ring-copper-300/60' : ''}`}
      aria-label={title}
    >
      {state === 'locked' && <LockClosedIcon className="h-7 w-7" />}
      {state === 'available' && <SparklesIcon className="h-7 w-7" />}
      {state === 'completed' && <CheckCircleIcon className="h-7 w-7" />}
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-copper-500"
          animate={{ scale: [1, 1.16, 1], opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}
