'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const highlights = [
  'Leçons courtes et progressives',
  'Exercices codés + simulation',
  'Feedback IA pédagogique',
  'Parcours gamifié et motivant',
];

const stats = [
  { label: 'Modules', value: '12+' },
  { label: 'XP', value: '320' },
  { label: 'Streak', value: '7 jours' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(198,121,63,0.24),_transparent_32%),linear-gradient(135deg,_#06120d_0%,_#0d1b15_45%,_#111c18_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.95),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(198,121,63,0.14),_transparent_45%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="rounded-[2rem] border border-copper-500/20 bg-slate-900/70 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-sm font-semibold uppercase tracking-[0.35em] text-copper-400"
              >
                TrainArduino • Formation Arduino immersive
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
              >
                Passez du rêve au circuit réel avec une formation futuriste et ludique.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mt-5 max-w-2xl text-lg text-slate-300"
              >
                Apprenez l’Arduino comme un véritable parcours de prototypage : leçons courtes,
                exercices interactifs, feedback IA et progression motivante à chaque étape.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/signup"
                  className="rounded-2xl bg-copper-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-copper-400"
                >
                  Commencer l’aventure
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-copper-500"
                >
                  Se connecter
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-copper-500/20 bg-copper-500/10 px-4 py-3 text-sm text-copper-100"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-copper-300">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.65, ease: 'easeOut' }}
              className="rounded-[2rem] border border-slate-700 bg-slate-950/70 p-6 shadow-inner"
            >
              <div className="rounded-2xl border border-copper-500/20 bg-copper-500/10 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-copper-300">
                  Pourquoi TrainArduino
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Un parcours d’apprentissage qui se branche à chaque étape.
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-copper-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm font-semibold text-white">Modules guidés</p>
                  <p className="mt-2 text-sm text-slate-400">Des étapes claires pour progresser sans vous perdre.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm font-semibold text-white">Éditeur intégré</p>
                  <p className="mt-2 text-sm text-slate-400">Codez, testez et apprenez dans un espace unique.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>
      </div>
    </div>
  );
}
