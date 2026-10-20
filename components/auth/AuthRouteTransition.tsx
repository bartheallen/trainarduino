'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ArduinoBoardVisual } from '@/components/ui/ArduinoBoardVisual';

export function AuthRouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const isSignup = pathname.includes('signup');

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: isSignup ? 80 : -80 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: isSignup ? -100 : 100 }}
        transition={{ duration: reducedMotion ? 0.15 : 0.45, ease: 'easeInOut' }}
        className="relative flex min-h-screen w-full items-center justify-center px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        {!reducedMotion && <motion.div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(34rem,78vw)] -translate-x-1/2 -translate-y-1/2 opacity-20" initial={{ x: isSignup ? -240 : 240, scale: 0.72, rotate: isSignup ? -8 : 8 }} animate={{ x: 0, scale: 1, rotate: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}><ArduinoBoardVisual /></motion.div>}
        <div className="relative z-10 w-full">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}
