'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

interface XpBarProps {
  currentXp: number;
  currentThreshold: number;
  nextThreshold: number;
  currentLevel: number;
}

/**
 * Animated XP bar with a live count-up for the current level progress.
 */
export function XpBar({ currentXp, currentThreshold, nextThreshold, currentLevel }: XpBarProps) {
  const xpInLevel = Math.max(0, currentXp - currentThreshold);
  const xpRange = Math.max(1, nextThreshold - currentThreshold);
  const progress = xpRange > 0 ? (xpInLevel / xpRange) * 100 : 100;
  const motionValue = useMotionValue(0);
  const width = useTransform(motionValue, [0, 100], ['0%', '100%']);
  const [count, setCount] = useState(xpInLevel);

  useEffect(() => {
    const controls = animate(motionValue, Math.min(100, progress), { duration: 0.8, ease: 'easeOut' });
    const countControls = animate(count, xpInLevel, { duration: 0.8, ease: 'easeOut', onUpdate: (value) => setCount(Math.round(value)) });
    return () => {
      controls.stop();
      countControls.stop();
    };
  }, [count, progress, motionValue, xpInLevel]);

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_16px_40px_rgba(2,6,23,0.24)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">XP actuel</p>
          <p className="mt-1 text-2xl font-semibold text-white">Niveau {currentLevel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-cyan-300">{count}</p>
          <p className="text-sm text-slate-400">/ {xpRange} XP</p>
        </div>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-slate-800/80">
        <motion.div
          style={{ width }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>Progression de niveau</span>
        <span>{Math.min(100, Math.round(progress))}%</span>
      </div>
    </div>
  );
}
