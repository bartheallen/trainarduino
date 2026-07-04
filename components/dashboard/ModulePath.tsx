'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ModuleNode } from './ModuleNode';
import { Card } from '@/components/ui/Card';

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

/**
 * Duolingo-style zigzag module path with an SVG copper trace and modal popover for module details.
 */
export function ModulePath({ modules }: ModulePathProps) {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  return (
    <div className="relative rounded-[2rem] border border-slate-200/70 bg-slate-950/95 p-6 text-slate-100 shadow-2xl dark:border-slate-800">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M10 20 C30 20, 30 40, 50 40 S70 60, 90 60" stroke="#C6793F" strokeWidth="1.2" fill="none" strokeDasharray="2 2" />
        <path d="M10 20 C30 20, 30 40, 50 40 S70 60, 90 60" stroke="#F3E1C5" strokeWidth="0.3" fill="none" opacity="0.45" />
      </svg>

      <div className="relative z-10 space-y-8">
        {modules.map((module, index) => {
          const state = module.status === 'completed' ? 'completed' : module.status === 'in_progress' ? 'available' : 'locked';
          const active = index === 0;
          const left = index % 2 === 0 ? 'justify-start' : 'justify-end';

          return (
            <div key={module.id} className={`flex ${left}`}>
              <div className="flex items-center gap-4">
                <ModuleNode
                  title={module.titre}
                  state={state as 'locked' | 'available' | 'completed'}
                  active={active}
                  onClick={() => setSelectedModule(module.id)}
                />
                <div className="max-w-[16rem]">
                  <p className="text-sm font-semibold text-slate-300">Module {module.ordre}</p>
                  <p className="text-lg font-semibold text-white">{module.titre}</p>
                  <p className="text-sm text-slate-400">{module.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedModule && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
            onClick={() => setSelectedModule(null)}
          >
            <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-copper-600">Module détaillé</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{modules.find((item) => item.id === selectedModule)?.titre}</h3>
                </div>
                <button className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSelectedModule(null)}>
                  Fermer
                </button>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                {modules.find((item) => item.id === selectedModule)?.description}
              </p>
              <div className="mt-6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">À venir</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Le contenu détaillé des leçons et exercices sera ajouté ici.</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
