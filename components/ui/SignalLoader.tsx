'use client';

import { motion } from 'framer-motion';

const bars = [18, 34, 24, 42, 30, 54, 26];

export function SignalLoader({ label = 'Synchronizing signals' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[1.4rem] border border-cyan-400/20 bg-slate-950/70 px-6 py-5 text-center text-sm text-slate-300">
      <div className="flex h-14 items-end gap-1.5">
        {bars.map((height, index) => (
          <motion.span
            key={`${height}-${index}`}
            className="w-2 rounded-full bg-gradient-to-t from-cyan-400 via-blue-500 to-emerald-400"
            animate={{ height: [height, height + 12, height], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 0.95, repeat: Infinity, delay: index * 0.07, ease: 'easeInOut' }}
            style={{ height }}
          />
        ))}
      </div>
      <div className="relative overflow-hidden rounded-full border border-cyan-400/20 bg-slate-900/80 px-4 py-2">
        <motion.span
          className="absolute inset-y-0 left-0 w-20 rounded-full bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
          animate={{ x: ['-80%', '80%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="relative text-[11px] uppercase tracking-[0.3em] text-cyan-200">{label}</span>
      </div>
    </div>
  );
}
