'use client';

import { ReactNode } from 'react';

interface PrimitiveInputProps {
  label?: ReactNode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PrimitiveInput({ label, placeholder, value, onChange, disabled = false, className = '' }: PrimitiveInputProps) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-slate-300">{label}</span> : null}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
    </label>
  );
}
