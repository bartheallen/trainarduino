'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const authRoutes = new Set([
  '/forgot-password',
  '/login',
  '/reset-password',
  '/signup',
  '/verify-email',
]);

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [animationComplete, setAnimationComplete] = useState(false);

  if (prefersReducedMotion || authRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => setAnimationComplete(true)}
      transformTemplate={(_, generatedTransform) =>
        animationComplete ? 'none' : generatedTransform
      }
    >
      {children}
    </motion.div>
  );
}
