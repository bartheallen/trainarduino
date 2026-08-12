'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { motionTokens } from './motion';

interface PrimitiveButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const base = 'relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full border font-semibold tracking-[0.02em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
  primary: 'border-cyan-400/25 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_10px_30px_rgba(50,231,255,0.16)]',
  secondary: 'border-white/10 bg-slate-900/80 text-slate-100 hover:border-cyan-400/30 hover:bg-slate-800/90',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/8 hover:text-white',
  accent: 'border-cyan-400/20 bg-slate-950/80 text-cyan-200 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]',
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.12)]',
  danger: 'border-rose-400/25 bg-rose-400/10 text-rose-200 shadow-[0_10px_30px_rgba(241,109,109,0.12)]',
};

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function PrimitiveButton({ children, variant = 'primary', size = 'md', disabled = false, loading = false, success = false, className = '', onClick, type = 'button' }: PrimitiveButtonProps) {
  const isDisabled = disabled || loading;
  const statusClasses = success ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.12)]' : '';

  return (
    <motion.button
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      whileHover={isDisabled ? undefined : { scale: 1.01, y: -1 }}
      transition={motionTokens.fast}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${statusClasses} ${sizes[size]} ${className}`}
    >
      <motion.span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_transparent_70%)]"
        animate={loading ? { opacity: [0.35, 0.7, 0.35] } : success ? { opacity: [0.2, 0.5, 0.2] } : { opacity: 0.18 }}
        transition={{ duration: 0.8, repeat: loading || success ? Infinity : 0, ease: 'easeInOut' }}
      />
      <span className="relative z-10">{loading ? 'Working…' : children}</span>
    </motion.button>
  );
}
