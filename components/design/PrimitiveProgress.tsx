'use client';

import { motion } from 'framer-motion';
import { motionTokens } from './motion';

interface PrimitiveProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export function PrimitiveProgress({ value, max = 100, className = '' }: PrimitiveProgressProps) {
  const safeValue = Math.max(0, Math.min(value, max));
  const percentage = (safeValue / max) * 100;

  return (
    <div className={`relative h-2 overflow-hidden rounded-full border border-white/10 bg-slate-800/80 ${className}`}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: percentage / 100 }}
        transition={{ duration: motionTokens.normal.duration, ease: motionTokens.normal.ease }}
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-20 rounded-full bg-white/30 blur-sm"
        animate={{ x: ['-120%', '220%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
