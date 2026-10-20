'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedNav } from '@/components/landing/AnimatedNav';
import { LandingPageSections } from '@/components/landing/LandingPageSections';
import { ScrollHint } from '@/components/landing/ScrollHint';
import { EngineeringBackground } from '@/components/design/EngineeringBackground';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { useDictionary } from '@/components/i18n/LocaleProvider';

export default function Home() {
  const dict = useDictionary();

  return (
    <div className="relative min-h-screen w-full text-slate-100">
      <EngineeringBackground className="opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.10),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(79,140,255,0.12),_transparent_28%)]" />
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl sm:-left-32 sm:-top-32 sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl sm:-right-32 sm:-bottom-32 sm:h-80 sm:w-80" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 pb-12 pt-[14vh] sm:px-6 lg:px-8">
        <AnimatedNav />

        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 flex min-h-[calc(100vh-8rem)] w-full items-center lg:min-h-[calc(100svh-20rem)]"
        >
          <div className="relative z-10 w-full max-w-[40rem]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
              <PrimitiveBadge tone="accent" className="inline-flex border-cyan-400/20 bg-cyan-500/5 px-3 py-1.5 text-[0.68rem] tracking-[0.22em] text-cyan-200">{dict.home.heroBadge}</PrimitiveBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mt-7 max-w-[16ch] text-balance font-semibold leading-[1.02] tracking-[-0.05em] text-white text-4xl sm:text-5xl lg:text-6xl"
            >
              {dict.home.heroTitle}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base lg:text-lg"
            >
              {dict.home.heroDescription}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link href="/signup" className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(50,231,255,0.2)] transition sm:w-auto">
                  {dict.home.startJourney}
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link href="/login" className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 sm:w-auto">
                  {dict.home.login}
                </Link>
              </motion.div>
            </motion.div>
          </div>
          <ScrollHint />
        </motion.header>

        <div className="glass-section-shell glass-section-shell--light relative z-10 mt-8">
          <LandingPageSections />
        </div>
      </div>
    </div>
  );
}
