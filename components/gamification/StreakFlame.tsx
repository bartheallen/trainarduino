'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/appStore';

interface StreakFlameProps {
  streak: number;
}

/**
 * Animated streak indicator with a subtle flame flicker when active.
 */
export function StreakFlame({ streak }: StreakFlameProps) {
  const storeStreak = useAppStore((state) => state.streak);
  const active = streak > 0 || storeStreak > 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-orange-300/60 bg-orange-50/70 px-4 py-3 text-orange-700 shadow-sm dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-300">
      <motion.div
        animate={active ? { rotate: [0, -6, 6, 0], scale: [1, 1.06, 0.98, 1] } : { scale: 1 }}
        transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
        className="text-2xl"
      >
        🔥
      </motion.div>
      <div>
        <p className="text-sm font-semibold">Streak</p>
        <p className="text-lg font-bold">{streak} jours</p>
      </div>
    </div>
  );
}
