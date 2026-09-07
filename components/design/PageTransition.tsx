'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0.5], scaleX: [0.985, 1.001, 1] }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-x-2 top-0 h-16 rounded-full bg-cyan-400/10 blur-3xl sm:inset-x-6 sm:h-20"
      />
      {children}
    </motion.div>
  );
}
