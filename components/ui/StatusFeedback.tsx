'use client';

import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, InboxIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { SignalLoader } from './SignalLoader';

interface StatusFeedbackProps {
  kind: 'success' | 'error' | 'empty' | 'loading';
  title: string;
  description?: string;
}

const styles = {
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  error: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  empty: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  loading: 'border-white/10 bg-slate-900/70 text-slate-200',
};

const icons = {
  success: CheckCircleIcon,
  error: ExclamationTriangleIcon,
  empty: InboxIcon,
  loading: SparklesIcon,
};

export function StatusFeedback({ kind, title, description }: StatusFeedbackProps) {
  const Icon = icons[kind];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`rounded-[1.4rem] border p-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.18)] ${styles[kind]}`}
    >
      {kind === 'loading' ? (
        <SignalLoader label="Loading workspace" />
      ) : (
        <>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-slate-950/60">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 opacity-80">{description}</p> : null}
        </>
      )}
    </motion.div>
  );
}
