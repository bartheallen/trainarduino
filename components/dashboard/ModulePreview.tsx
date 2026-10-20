'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useDictionary } from '@/components/i18n/LocaleProvider';

interface ModulePreviewProps {
  modules: Array<{
    id: number;
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
    is_capstone?: boolean;
    status: string;
  }>;
  totalModules: number;
}

type ModuleState = 'completed' | 'in_progress' | 'available' | 'locked';

export function ModulePreview({ modules, totalModules }: ModulePreviewProps) {
  const dict = useDictionary();
  const shouldReduceMotion = useReducedMotion();
  const labels: Record<ModuleState, string> = {
    completed: dict.common.moduleCompleted,
    in_progress: dict.common.moduleInProgress,
    available: dict.common.moduleAvailable,
    locked: dict.common.moduleLocked,
  };
  const visibleModules = [...modules]
    .sort((a, b) => a.ordre - b.ordre)
    .slice(0, 2)
    .map((module) => ({
      ...module,
      state: (module.status === 'completed'
        ? 'completed'
        : module.status === 'in_progress' || module.status === 'available'
          ? module.status
          : 'locked') as ModuleState,
    }));

  return (
    <div className="w-full min-w-0 space-y-3">
      {visibleModules.map((module, index) => {
        const isLocked = module.state === 'locked';
        const accent = module.state === 'completed'
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          : module.state === 'in_progress' || module.state === 'available'
            ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
            : 'border-slate-700 bg-slate-800/80 text-slate-400';

        return (
          <motion.div
            key={module.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05 * index }}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            className="min-w-0"
          >
            <Link
              href="/modules"
              className="group block min-w-0 rounded-[1.25rem] border border-white/10 bg-slate-900/60 p-4 text-left backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    module.state === 'completed'
                      ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                      : module.state === 'in_progress' || module.state === 'available'
                        ? 'border-cyan-400/30 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  {isLocked ? '🔒' : module.ordre}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {dict.dashboard.moduleLabel.replace('{order}', String(module.ordre))}
                    </p>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${accent}`}>
                      {labels[module.state]}
                    </span>
                  </div>

                  <h3 className="mt-2 break-words text-base font-semibold text-white">
                    {module.titre}
                  </h3>
                  <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-400">
                    {module.description || dict.common.courseUnavailable}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      <Link
        href="/modules"
        className="block w-full rounded-[1.25rem] border border-white/10 bg-slate-900/60 px-4 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
      >
        {dict.dashboard.seeAllModules.replace('{count}', String(totalModules))}
      </Link>
    </div>
  );
}
