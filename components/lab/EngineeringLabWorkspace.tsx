'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { PrimitiveBadge } from '@/components/design/PrimitiveBadge';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';
import { PrimitiveProgress } from '@/components/design/PrimitiveProgress';
import { CircuitChipIcon, LedIndicator, SignalWaveIcon } from '@/components/ui/ElectronicsIcons';

interface EngineeringLabWorkspaceProps {
  module: {
    titre: string;
    description: string | null;
    ordre: number;
    palier_test: number;
  };
  lessons: Array<{
    id: number;
    titre: string;
    contenu: string;
  }>;
  exercises: Array<{
    id: number;
    titre: string;
    enonce: string;
    difficulte: string;
    xp_recompense: number;
  }>;
}

const actions = [
  { label: 'Verify', tone: 'neutral' },
  { label: 'Compile', tone: 'accent' },
  { label: 'Upload', tone: 'success' },
  { label: 'Run Simulation', tone: 'neutral' },
  { label: 'Reset', tone: 'warning' },
];

const aiMessages = [
  { role: 'mentor', text: 'Signal stability is strong. The next adjustment should improve latency.' },
  { role: 'system', text: 'Compilation queue ready. Waiting for the next validation cycle.' },
];

const consoleLogs = [
  { label: 'Build', value: 'Compiled successfully', color: 'text-emerald-300' },
  { label: 'Serial', value: 'Listening on COM4', color: 'text-cyan-300' },
  { label: 'Simulation', value: 'LED pulse synchronized', color: 'text-slate-300' },
];

const codeLines = ['void setup() {', '  pinMode(LED_BUILTIN, OUTPUT);', '}', '', 'void loop() {', '  digitalWrite(LED_BUILTIN, HIGH);', '  delay(500);', '  digitalWrite(LED_BUILTIN, LOW);', '  delay(500);', '}'];

export function EngineeringLabWorkspace({ module, lessons, exercises }: EngineeringLabWorkspaceProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
            <CircuitChipIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Engineering Lab</p>
            <h1 className="text-xl font-semibold text-white">{module.titre}</h1>
          </div>
        </div>
        <PrimitiveBadge tone="accent">Version 1.0</PrimitiveBadge>
      </div>

      <div className="rounded-[1.8rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  action.tone === 'accent'
                    ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/25'
                    : action.tone === 'success'
                      ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25'
                      : action.tone === 'warning'
                        ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25'
                        : 'bg-white/8 text-slate-200 ring-1 ring-white/10'
                }`}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            <LedIndicator className="shrink-0" />
            Ready
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_310px]">
          <aside className="space-y-4">
            <PrimitiveCard tone="glass" className="p-4">
              <div className="flex items-center gap-2">
                <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Mission</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-400">{module.description}</p>
              <div className="mt-4 space-y-2">
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">Objective • Build a stable signal loop</div>
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">Lesson shortcuts • {lessons.length} sections</div>
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">Components • {exercises.length} exercises</div>
              </div>
            </PrimitiveCard>

            <PrimitiveCard tone="raised" className="p-4">
              <div className="flex items-center gap-2">
                <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Lessons</p>
              </div>
              <div className="mt-4 space-y-2">
                {lessons.slice(0, 4).map((lesson, index) => (
                  <button key={lesson.id} className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2 text-left text-sm text-slate-300 transition hover:border-cyan-400/30 hover:text-white">
                    <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-500">0{index + 1}</span>
                    <span className="mt-1 block font-medium">{lesson.titre}</span>
                  </button>
                ))}
              </div>
            </PrimitiveCard>
          </aside>

          <div className="space-y-4">
            <PrimitiveCard tone="floating" className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">main.ino</div>
              </div>
              <div className="grid gap-4 bg-slate-950/70 p-4 lg:grid-cols-[auto_minmax(0,1fr)]">
                <div className="select-none text-sm leading-7 text-slate-600">
                  {codeLines.map((_, index) => (
                    <div key={`${index}-${_}`} className="px-2">{index + 1}</div>
                  ))}
                </div>
                <pre className="overflow-hidden text-sm leading-7 text-slate-300">
                  <code>{codeLines.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}</code>
                </pre>
              </div>
            </PrimitiveCard>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <PrimitiveCard tone="glass" className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Simulation</p>
                  <PrimitiveBadge tone="neutral">Live</PrimitiveBadge>
                </div>
                <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Signal flow</span>
                    <span className="text-cyan-300">Optimal</span>
                  </div>
                  <div className="mt-4">
                    <PrimitiveProgress value={82} />
                  </div>
                  <div className="mt-4 h-24 rounded-[1rem] border border-dashed border-cyan-400/20 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.16),_transparent_70%)]" />
                </div>
              </PrimitiveCard>

              <PrimitiveCard tone="glass" className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Status</p>
                  <PrimitiveBadge tone="success">Stable</PrimitiveBadge>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-400">
                  <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2">Board <span className="text-slate-200">Arduino Uno</span></div>
                  <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2">Port <span className="text-slate-200">COM4</span></div>
                  <div className="flex items-center justify-between rounded-[1rem] border border-white/10 bg-slate-950/70 px-3 py-2">Memory <span className="text-slate-200">62%</span></div>
                </div>
              </PrimitiveCard>
            </div>
          </div>

          <aside className="space-y-4">
            <PrimitiveCard tone="glass" className="p-4">
              <div className="flex items-center gap-2">
                <SignalWaveIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">AI Mentor</p>
              </div>
              <div className="mt-4 space-y-3">
                {aiMessages.map((message, index) => (
                  <motion.div key={`${message.role}-${index}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.06 }} className={`rounded-[1rem] border p-3 text-sm leading-7 ${message.role === 'mentor' ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-slate-950/70 text-slate-300'}`}>
                    {message.text}
                  </motion.div>
                ))}
              </div>
            </PrimitiveCard>

            <PrimitiveCard tone="raised" className="p-4">
              <div className="flex items-center gap-2">
                <CircuitChipIcon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Pins & Registers</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">Pin 13 • Output</div>
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">DDR B • 0x24</div>
                <div className="rounded-[1rem] border border-white/10 bg-slate-950/70 p-3">PORT B • 0xFF</div>
              </div>
            </PrimitiveCard>
          </aside>
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <LedIndicator className="shrink-0" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Console</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Board: Arduino Uno</span>
              <span>•</span>
              <span>Lesson: {module.titre}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[1.15rem] border border-white/10 bg-black/60 p-4 font-mono text-sm text-slate-300">
              {consoleLogs.map((log) => (
                <div key={log.label} className="mb-2 flex items-center justify-between gap-3">
                  <span className={log.color}>{log.label}</span>
                  <span>{log.value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {exercises.slice(0, 3).map((exercise) => (
                <div key={exercise.id} className="rounded-[1rem] border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-400">
                  <p className="font-semibold text-white">{exercise.titre}</p>
                  <p className="mt-1">{exercise.enonce}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
