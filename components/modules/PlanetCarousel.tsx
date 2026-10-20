'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PlanetCard {
  id: number;
  ordre: number;
  titre: string;
  description: string | null;
  state: 'completed' | 'in_progress' | 'available' | 'locked';
  href: string;
  isCapstone: boolean;
}

interface PlanetCarouselProps {
  cards: PlanetCard[];
}

const labels = {
  completed: 'Terminé',
  in_progress: 'En cours',
  available: 'Disponible',
  locked: 'Verrouillé',
  previous: 'Précédent',
  next: 'Suivant',
  reopen: 'Reprendre',
  openCourse: 'Ouvrir le cours',
  openChallenge: 'Ouvrir le défi',
  review: 'Revoir le cours',
  lockedMessage: 'Validez le module précédent pour ouvrir ce dossier.',
};

const palette = ['#67e8f9', '#60a5fa', '#34d399', '#818cf8'];
const PLANET_SIZES = {
  active: 220,
  nearby: 150,
  far: 118,
} as const;

export function PlanetCarousel({ cards }: PlanetCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelLockRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    const inProgressIndex = cards.findIndex((card) => card.state === 'in_progress');
    const availableIndex = cards.findIndex((card) => card.state === 'available');
    return inProgressIndex >= 0 ? inProgressIndex : availableIndex >= 0 ? availableIndex : 0;
  });
  const [stageWidth, setStageWidth] = useState(0);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (cards.length === 0) return;
    const validIndex = Math.min(Math.max(activeIndex, 0), cards.length - 1);
    if (validIndex !== activeIndex) setActiveIndex(validIndex);
  }, [activeIndex, cards.length]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const updateSize = () => setStageWidth(element.clientWidth);
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const step = stageWidth > 0 ? (stageWidth * (stageWidth < 640 ? 0.34 : stageWidth < 1024 ? 0.28 : 0.24)) : 170;
  const total = cards.length;

  const move = useCallback((delta: number) => {
    setActiveIndex((current) => {
      const nextIndex = Math.min(Math.max(current + delta, 0), total - 1);
      return nextIndex;
    });
  }, [total]);

  const activeCard = cards[activeIndex] ?? cards[0];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < cards.length - 1;

  useEffect(() => {
    if (!stageRef.current || shouldReduceMotion) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.currentTarget !== stageRef.current) return;
      if (event.deltaY === 0) return;
      if (!hasPrevious && event.deltaY < 0) return;
      if (!hasNext && event.deltaY > 0) return;

      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      if (wheelLockRef.current !== null) {
        window.clearTimeout(wheelLockRef.current);
      }
      wheelLockRef.current = window.setTimeout(() => {
        move(direction);
      }, 0);
    };

    const element = stageRef.current;
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
      if (wheelLockRef.current !== null) window.clearTimeout(wheelLockRef.current);
    };
  }, [hasNext, hasPrevious, move, shouldReduceMotion]);

  if (cards.length === 0) return null;

  if (shouldReduceMotion) {
    return (
      <div className="w-full min-w-0">
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="rounded-[1.25rem] border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Module {card.ordre}</span>
                <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                  {labels[card.state]}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{card.titre}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{card.description ?? 'Aucun résumé disponible pour ce module.'}</p>
              {card.state !== 'locked' ? (
                <Link href={card.href} className="mt-4 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-100">
                  {card.state === 'in_progress' ? labels.reopen : card.state === 'completed' ? labels.review : card.isCapstone ? labels.openChallenge : labels.openCourse}
                </Link>
              ) : (
                <p className="mt-4 text-sm text-slate-400">{labels.lockedMessage}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div
        ref={stageRef}
        role="group"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Parcours des modules"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
          if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
          if (event.key === 'End') { event.preventDefault(); setActiveIndex(cards.length - 1); }
        }}
        className="group relative h-[clamp(26rem,64vh,30rem)] w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 outline-none sm:h-[clamp(29rem,62vh,34rem)] lg:h-[clamp(31rem,60vh,36rem)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.06),_transparent_42%)]" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="50" cy="50" rx="30" ry="15" fill="none" stroke="rgba(103,232,249,0.13)" strokeWidth="0.12" />
          <ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="rgba(103,232,249,0.1)" strokeWidth="0.12" transform="rotate(12 50 50)" />
        </svg>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.48)_12%,rgba(2,6,23,0)_25%,rgba(2,6,23,0)_75%,rgba(2,6,23,0.48)_88%,rgba(2,6,23,0.96)_100%)]" />
        <div className="absolute inset-x-0 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
        <div className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
        <div className="absolute right-[16%] top-[25%] h-1 w-1 rounded-full bg-slate-300/80" />
        <div className="absolute left-[38%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-cyan-200/60" />

        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
          {cards.map((card, index) => {
            const offset = index - activeIndex;
            if (Math.abs(offset) > 2) return null;

            const x = offset * step;
            const y = offset * offset * 14;
            const scale = Math.max(0.7, 1 - 0.12 * Math.abs(offset));
            const opacity = Math.max(0.35, 1 - 0.18 * Math.abs(offset));
            const zIndex = 10 - Math.abs(offset);
            const isActive = index === activeIndex;
            const sizePx = isActive ? PLANET_SIZES.active : Math.max(PLANET_SIZES.far, PLANET_SIZES.nearby - Math.abs(offset) * 18);

            return (
              <motion.div
                key={card.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 60) move(info.offset.x > 0 ? -1 : 1);
                }}
                animate={{ x, y, scale, opacity, zIndex }}
                transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.9 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transformOrigin: 'center center' }}
              >
                <button
                  type="button"
                  aria-label={`Module ${card.ordre} : ${card.titre}, ${labels[card.state]}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={`group relative flex items-center justify-center rounded-full border text-white outline-none ring-offset-0 transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                    isActive ? 'cursor-default' : 'cursor-pointer'
                  }`}
                  style={{
                    width: `${sizePx}px`,
                    height: `${sizePx}px`,
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 18%, ${palette[(card.ordre - 1) % palette.length]} 28%, rgba(15,23,42,0.95) 72%)`,
                      boxShadow: isActive ? `0 0 32px ${palette[(card.ordre - 1) % palette.length]}66` : 'none',
                    }}
                  />
                  {card.state === 'completed' && (
                    <span className="absolute inset-0 rounded-full shadow-[inset_0_0_18px_rgba(52,211,153,0.7)]" />
                  )}
                  {card.state === 'in_progress' && (
                    <span className="absolute inset-[-10px] rounded-full border-[3px] border-dashed border-cyan-300/80 animate-[spin_10s_linear_infinite]" />
                  )}
                  {card.state === 'available' && (
                    <span className="absolute inset-[-6px] rounded-full border border-cyan-300/60" />
                  )}
                  {card.state === 'locked' && (
                    <span className="absolute inset-0 rounded-full bg-slate-800/90" />
                  )}
                  {card.state === 'locked' && (
                    <span className="absolute inset-3 rounded-full border border-white/10 bg-slate-950/40" />
                  )}
                  {card.isCapstone && (
                    <span
                      className="absolute -inset-1 rounded-full border border-cyan-300/40"
                      style={{ transform: 'rotate(-20deg) scaleX(1.2)', borderRadius: '999px' }}
                    />
                  )}
                  {(card.state === 'completed' || card.state === 'in_progress') && (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl text-emerald-200">✓</span>
                  )}
                  {card.state === 'available' && (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl text-cyan-200">↗</span>
                  )}
                  {card.state === 'locked' && (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl text-slate-400 sm:text-3xl" style={{ transform: `scale(${isActive ? 1.1 : 0.9})` }}>🔒</span>
                  )}
                  <span className="relative z-10 text-2xl font-semibold text-white">
                    {card.ordre}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
        {focused && <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">Focus clavier</div>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} disabled={!hasPrevious} aria-label={labels.previous} className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
            Précédent
          </button>
          <button type="button" onClick={() => move(1)} disabled={!hasNext} aria-label={labels.next} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40">
            Suivant
          </button>
        </div>
        <p className="text-sm font-medium text-slate-300">Module {activeCard.ordre} / {total}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCard.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mt-5 rounded-[1.25rem] border border-white/10 bg-slate-900/60 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Module {activeCard.ordre}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{activeCard.titre}</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
              {labels[activeCard.state]}
            </span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{activeCard.description ?? 'Aucun résumé disponible pour ce module.'}</p>

          {activeCard.state === 'locked' ? (
            <p className="mt-4 text-sm text-slate-400">{labels.lockedMessage}</p>
          ) : (
            <Link href={activeCard.href} className="mt-4 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15">
              {activeCard.state === 'in_progress' ? labels.reopen : activeCard.state === 'completed' ? labels.review : activeCard.isCapstone ? labels.openChallenge : labels.openCourse}
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
