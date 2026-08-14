'use client';

import { motion } from 'framer-motion';
import { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { motionTokens } from './motion';

interface PrimitiveCardProps {
  children: ReactNode;
  tone?: 'flat' | 'raised' | 'floating' | 'glass' | 'interactive';
  className?: string;
  hoverable?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const tones = {
  flat: 'border border-white/10 bg-[#0d1722] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
  raised: 'border border-white/10 bg-[#121d2b] shadow-[0_16px_38px_rgba(0,0,0,0.26)]',
  floating: 'border border-white/10 bg-[#121d2b]/90 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl',
  glass: 'border border-white/10 bg-white/5 shadow-[0_12px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl',
  interactive: 'border border-cyan-400/20 bg-slate-900/80 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_36px_rgba(50,231,255,0.12)]',
};

export function PrimitiveCard({ children, tone = 'raised', className = '', hoverable = true, onClick, onKeyDown }: PrimitiveCardProps) {
  const isInteractive = Boolean(onClick);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { y: -4, scale: 1.01, boxShadow: '0 24px 60px rgba(2,6,23,0.28)' } : undefined}
      whileTap={hoverable ? { scale: 0.995 } : undefined}
      transition={motionTokens.normal}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`relative w-full max-w-full rounded-[1.25rem] border border-white/10 p-5 sm:p-6 ${tones[tone]} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.035)_40%,transparent_100%)]" />
      <div className="relative z-10 min-w-0">{children}</div>
    </motion.div>
  );
}
