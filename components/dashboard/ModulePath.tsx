'use client';

import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ModuleNode } from './ModuleNode';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

interface ModulePathProps {
  modules: Array<{
    id: number;
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
    status: string;
  }>;
}

export function ModulePath({ modules }: ModulePathProps) {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const pathways = useMemo(() => {
    return modules.map((module, index) => {
      const state = module.status === 'completed' ? 'completed' : module.status === 'in_progress' || module.status === 'available' ? 'available' : 'locked';
      const active = module.status === 'in_progress';
      const align = index % 2 === 0 ? 'justify-start' : 'justify-end';
      const accent = state === 'completed' ? 'from-emerald-400/30 via-transparent to-transparent' : state === 'available' ? 'from-cyan-400/20 via-transparent to-transparent' : 'from-slate-700/20 via-transparent to-transparent';

      return { ...module, state, active, align, accent };
    });
  }, [modules]);

  return (
    <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_26%)]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 20 C30 20, 30 40, 50 40 S70 60, 90 60" stroke="rgba(34,211,238,0.24)" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M10 20 C30 20, 30 40, 50 40 S70 60, 90 60" stroke="rgba(255,255,255,0.16)" strokeWidth="0.25" fill="none" opacity="0.45" />
        <path d="M10 78 C24 78, 36 64, 48 64 S66 52, 90 52" stroke="rgba(16,185,129,0.22)" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeDasharray="1.2 2" />
      </svg>

      <div className="relative z-10 space-y-8">
        {pathways.map((module, index) => (
          <motion.div key={module.id} className={`flex min-w-0 ${module.align}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 * index }}>
            <div className="flex min-w-0 items-center gap-4 rounded-[1.25rem] border border-white/10 bg-slate-900/60 px-4 py-3 backdrop-blur-xl">
              <ModuleNode
                title={module.titre}
                state={module.state as 'locked' | 'available' | 'completed'}
                active={module.active}
                onClick={() => setSelectedModule(module.id)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Module {module.ordre}</p>
                <p className="break-words text-lg font-semibold text-white">{module.titre}</p>
                {module.state === 'locked' && (
                  <p className="mt-1 break-words text-sm leading-6 text-slate-400">🔒 À débloquer</p>
                )}
                {module.state !== 'locked' && (
                  <Link href={`/modules/${module.id}`} className="mt-3 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/20">
                    {module.state === 'completed' ? 'Revoir le cours' : 'Ouvrir le cours'}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
            onClick={() => setSelectedModule(null)}
          >
            <motion.div initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} transition={{ duration: 0.24 }} onClick={(e) => e.stopPropagation()}>
              <PrimitiveCard tone="floating" className="w-full max-w-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Module détaillé</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{modules.find((item) => item.id === selectedModule)?.titre}</h3>
                  </div>
                  <button className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10" onClick={() => setSelectedModule(null)}>
                    Fermer
                  </button>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  Ce module est accessible depuis votre parcours actuel. Vous pouvez le reprendre quand vous êtes prêt.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-sm font-semibold text-white">Compétences</p>
                    <p className="mt-2 text-sm text-slate-400">Logique de branchement, signal et contrôle.</p>
                  </div>
                  <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-sm font-semibold text-white">Exercices</p>
                    <p className="mt-2 text-sm text-slate-400">1 mini projet · 3 exercices guidés</p>
                  </div>
                </div>
              </PrimitiveCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
