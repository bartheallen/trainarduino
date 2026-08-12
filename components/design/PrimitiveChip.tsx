import { ReactNode } from 'react';

interface PrimitiveChipProps {
  children: ReactNode;
  active?: boolean;
  tone?: 'neutral' | 'accent' | 'success';
  className?: string;
}

const tones = {
  neutral: 'border-white/10 bg-white/5 text-slate-300',
  accent: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
};

export function PrimitiveChip({ children, active = false, tone = 'neutral', className = '' }: PrimitiveChipProps) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${tones[tone]} ${active ? 'ring-1 ring-cyan-400/25' : ''} ${className}`}>{children}</span>;
}
