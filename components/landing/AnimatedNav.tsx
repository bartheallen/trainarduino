'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

export function AnimatedNav() {
  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 60], [0.82, 0.96]);
  const blur = useTransform(scrollY, [0, 60], ['24px', '30px']);
  const paddingY = useTransform(scrollY, [0, 60], ['0.8rem', '0.6rem']);

  return (
    <motion.nav
      style={{
        opacity: backgroundOpacity,
        backdropFilter: blur,
        paddingTop: paddingY,
        paddingBottom: paddingY,
      }}
      className="sticky top-3 z-30 mx-auto mb-8 w-[min(92vw,1100px)] rounded-full border border-white/15 bg-slate-950/80 px-4 shadow-[0_12px_40px_rgba(0,0,0,0.34),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <motion.div animate={{ rotate: [0, 4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
            <span className="text-sm font-semibold">TA</span>
          </motion.div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">TrainArduino</p>
            <p className="text-sm text-slate-300">Engineering education</p>
          </div>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">Connexion</Link>
          <Link href="/signup" className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_36px_rgba(50,231,255,0.18)]">Commencer</Link>
        </div>
      </div>
    </motion.nav>
  );
}
