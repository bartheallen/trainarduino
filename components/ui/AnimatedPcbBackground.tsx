'use client';

import { motion } from 'framer-motion';

const traces = [
  'M120 180 H340 C420 180 420 260 500 260 H760 C820 260 820 340 900 340 H1120',
  'M180 420 H420 C480 420 480 500 560 500 H820 C900 500 900 600 980 600 H1240',
  'M220 760 H500 C560 760 560 680 640 680 H920 C992 680 992 760 1068 760 H1340',
];

const nodes = [
  { cx: 240, cy: 180, delay: 0.2 },
  { cx: 500, cy: 260, delay: 0.5 },
  { cx: 900, cy: 340, delay: 0.8 },
  { cx: 320, cy: 420, delay: 1.1 },
  { cx: 820, cy: 500, delay: 1.4 },
  { cx: 620, cy: 680, delay: 1.7 },
  { cx: 1068, cy: 760, delay: 2 },
];

export function AnimatedPcbBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(198,121,63,0.16),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(52,211,153,0.14),_transparent_28%)]" />
      <svg viewBox="0 0 1440 900" className="absolute inset-0 h-full w-full opacity-80" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(198,121,63,0.24)" strokeWidth="2" fill="none">
          {traces.map((trace) => (
            <path key={trace} d={trace} />
          ))}
        </g>
        <g stroke="rgba(94,234,212,0.18)" strokeWidth="1" fill="none">
          {traces.map((trace) => (
            <path key={`${trace}-secondary`} d={trace} strokeDasharray="5 8" />
          ))}
        </g>
        <motion.path
          d="M120 180 H340 C420 180 420 260 500 260 H760 C820 260 820 340 900 340 H1120"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0.1, opacity: 0.2 }}
          animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M180 420 H420 C480 420 480 500 560 500 H820 C900 500 900 600 980 600 H1240"
          stroke="rgba(198,121,63,0.85)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0.15, opacity: 0.25 }}
          animate={{ pathLength: [0.15, 1, 0.15], opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />
        {nodes.map((node) => (
          <g key={`${node.cx}-${node.cy}`}>
            <motion.circle cx={node.cx} cy={node.cy} r="6" fill="rgba(255,255,255,0.8)" animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: node.delay }} />
            <motion.circle cx={node.cx} cy={node.cy} r="10" fill="rgba(198,121,63,0.18)" animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: node.delay }} />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.03)_40%,transparent_100%)]" />
    </div>
  );
}
