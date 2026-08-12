'use client';

import { motion } from 'framer-motion';

interface StreakFlameProps {
  streak: number;
}

/**
 * Animated streak indicator with a subtle flame flicker when active.
 */
export function StreakFlame({ streak }: StreakFlameProps) {
  const active = streak > 0;

  return (
    <div className="flex items-center gap-3 rounded-[1rem] border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-cyan-200 shadow-[0_10px_30px_rgba(50,231,255,0.08)]">
      <motion.div
        animate={active ? { rotate: [0, -6, 6, 0], scale: [1, 1.06, 0.98, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        className="text-2xl"
      >
        🔥
      </motion.div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Streak</p>
        <p className="mt-1 text-lg font-semibold text-white">{streak} jours</p>
      </div>
    </div>
  );
}
