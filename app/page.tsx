'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedNav } from '@/components/landing/AnimatedNav';
import { LandingPageSections } from '@/components/landing/LandingPageSections';
import { EngineeringBackground } from '@/components/design/EngineeringBackground';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

const stats = [
  { label: 'Modules', value: '12+' },
  { label: 'XP', value: '320' },
  { label: 'Signal score', value: '9.2/10' },
];

const codeSample = ['void setup() {', 'pinMode(LED_BUILTIN, OUTPUT);', '}', 'void loop() {', 'digitalWrite(LED_BUILTIN, HIGH);', '}'];

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100">
      <EngineeringBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.10),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(79,140,255,0.12),_transparent_28%)]" />
      <motion.div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl sm:-left-32 sm:-top-32 sm:h-72 sm:w-72" animate={{ x: [0, 12, 0], y: [0, 8, 0], scale: [1, 1.03, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl sm:-right-32 sm:-bottom-32 sm:h-80 sm:w-80" animate={{ x: [0, -12, 0], y: [0, -8, 0], scale: [1, 1.04, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-16 pt-4 sm:px-6 lg:px-8">
        <AnimatedNav />

        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 mt-4 w-full overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-900/60 p-4 shadow-[0_25px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-8 xl:p-10"
        >
          <div className="grid w-full gap-6 sm:gap-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-center">
            <div className="w-full min-w-0 max-w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="min-w-0 max-w-full">
                <PrimitiveBadge tone="accent" className="max-w-full flex-wrap">Apprentissage électronique de nouvelle génération</PrimitiveBadge>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-5 w-full min-w-0 max-w-full break-words font-semibold leading-[0.95] tracking-[-0.03em] text-white text-3xl sm:text-4xl md:text-5xl lg:text-7xl">
                Comprenez l’électronique en construisant une intuition solide.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-6 w-full max-w-2xl min-w-0 break-words text-sm text-slate-300 sm:text-base sm:text-lg">
                TrainArduino transforme chaque leçon en expérience précise et calme, avec un accompagnement visuel, des retours instantanés et une progression qui donne envie de continuer.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row">
                <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full min-w-0 sm:w-auto">
                  <Link href="/signup" className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(50,231,255,0.2)] transition">
                    Commencer le parcours
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full min-w-0 sm:w-auto">
                  <Link href="/login" className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40">
                    Se connecter
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="mt-8 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.16)] backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }} className="relative w-full min-w-0 max-w-full">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20 blur-2xl" />
              <PrimitiveCard tone="floating" className="relative w-full max-w-full p-4 sm:p-6">
                <div className="w-full rounded-[1.3rem] border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-cyan-300">
                    <span>Live studio</span>
                    <span>01 / 03</span>
                  </div>
                  <div className="mt-4 w-full rounded-[1.2rem] border border-white/10 bg-slate-950/80 p-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
                      <span className="break-words">Embedded circuit loop</span>
                    </div>
                      <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} className="w-full rounded-[1.2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
                      <div className="grid w-full grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, index) => (
                          <div key={index} className="h-3 rounded-full bg-white/10" />
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-slate-300">
                        <p className="font-semibold text-white">Signal path</p>
                        <p className="mt-1 break-words text-slate-400">Prototype, test and refine inside a workspace that feels precise from the first blink.</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-5 w-full rounded-[1.3rem] border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                    <span>Live code preview</span>
                    <span className="text-cyan-300">running</span>
                  </div>
                  <pre className="mt-3 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-slate-300">
                    {codeSample.map((line, index) => (
                      <div key={`${line}-${index}`} className={index === 0 ? 'text-cyan-300' : ''}>{line}</div>
                    ))}
                  </pre>
                </div>
              </PrimitiveCard>
            </motion.div>
          </div>
        </motion.header>

        <LandingPageSections />
      </div>
    </div>
  );
}
