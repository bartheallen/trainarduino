'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/appStore';

interface XpBarProps {
  currentXp: number;
  nextLevelXp: number;
  currentLevel: number;
}

/**
 * Animated XP bar with a live count-up for the current level progress.
 */
export function XpBar({ currentXp, nextLevelXp, currentLevel }: XpBarProps) {
  const xp = useAppStore((state) => state.xp);
  const setXp = useAppStore((state) => state.setXp);

  useEffect(() => {
    setXp(currentXp);
  }, [currentXp, setXp]);

  const progress = (xp / nextLevelXp) * 100;
  const motionValue = useMotionValue(0);
  const width = useTransform(motionValue, [0, 100], ['0%', '100%']);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, progress, { duration: 0.8, ease: 'easeOut' });
    const countControls = animate(0, xp, { duration: 0.8, ease: 'easeOut', onUpdate: (value) => setCount(Math.round(value)) });
    return () => {
      controls.stop();
      countControls.stop();
    };
  }, [xp, progress, motionValue]);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">XP actuel</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Niveau {currentLevel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-copper-600">{count}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">/ {nextLevelXp} XP</p>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <motion.div
          style={{ width }}
          className="h-full rounded-full bg-gradient-to-r from-copper-500 via-emerald-500 to-copper-400"
        />
      </div>
    </div>
  );
}
