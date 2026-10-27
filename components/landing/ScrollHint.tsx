'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDictionary } from '@/components/i18n/LocaleProvider';

export function ScrollHint() {
  const dict = useDictionary();
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY <= 80);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      animate={{ opacity: visible ? 1 : 0, y: visible && !reduceMotion ? [0, 5, 0] : 0 }}
      transition={
        visible && !reduceMotion
          ? { opacity: { duration: 0.25 }, y: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } }
          : { opacity: { duration: 0.25 }, y: { duration: 0 } }
      }
      className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs text-slate-300"
    >
      <span>{dict.home.exploreScroll}</span>
      <span className="h-7 w-px bg-gradient-to-b from-cyan-200/80 to-transparent" />
    </motion.div>
  );
}