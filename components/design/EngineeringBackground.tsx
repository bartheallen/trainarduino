'use client';

import { motion } from 'framer-motion';

export function EngineeringBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 min-w-0 max-w-full ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.09),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(79,140,255,0.08),_transparent_28%)]" />
      <svg viewBox="0 0 1600 1000" className="absolute inset-0 h-full w-full max-w-none min-w-0 opacity-70" preserveAspectRatio="xMidYMid slice">
        <path d="M120 220 H380 C470 220 470 320 560 320 H940 C1030 320 1030 220 1120 220 H1420" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M220 620 H520 C620 620 620 710 720 710 H1060 C1140 710 1140 620 1240 620 H1380" stroke="rgba(50,231,255,0.16)" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="5 8" />
        {Array.from({ length: 8 }).map((_, index) => (
          <motion.circle key={index} cx={220 + index * 170} cy={220 + (index % 2) * 150} r="2.2" fill="rgba(255,255,255,0.8)" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.3 + index * 0.12, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.02)_35%,transparent_100%)]" />
    </div>
  );
}
