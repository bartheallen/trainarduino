import { ReactNode } from 'react';

interface PrimitiveBadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  className?: string;
}

const tones = {
  neutral: 'border-white/10 bg-white/5 text-slate-300',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  danger: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  accent: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  info: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  'in-progress': 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  locked: 'border-slate-600/30 bg-slate-900/80 text-slate-400',
};

export function PrimitiveBadge({ children, tone = 'neutral', className = '' }: PrimitiveBadgeProps) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${tones[tone]} ${className}`} style={{ minWidth: 0 }}>
      <span className="truncate">{children}</span>
    </span>
  );
}
