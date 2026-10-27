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

const STATE_PALETTE = {
  completed: { light: '#6ee7b7', base: '#059669', glow: 'rgba(16,185,129,0.36)', border: 'rgba(110,231,183,0.7)' },
  in_progress: { light: '#a5f3fc', base: '#0891b2', glow: 'rgba(34,211,238,0.55)', border: 'rgba(103,232,249,0.85)' },
  available: { light: '#c4b5fd', base: '#4f46e5', glow: 'rgba(129,140,248,0.3)', border: 'rgba(165,180,252,0.6)' },
  locked: { light: '#64748b', base: '#263449', glow: 'rgba(71,85,105,0.12)', border: 'rgba(100,116,139,0.35)' },
} as const;

const PLANET_SIZES = {
  active: { desktop: 220, tablet: 200, mobile: 174, tiny: 152 },
  nearby: { desktop: 150, tablet: 128, mobile: 104, tiny: 86 },
  far: { desktop: 118, tablet: 102, mobile: 82, tiny: 70 },
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
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (cards.length === 0) return;
    const validIndex = Math.min(Math.max(activeIndex, 0), cards.length - 1);
    if (validIndex !== activeIndex) setActiveIndex(validIndex);
  }, [activeIndex, cards.length]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const updateSize = () => {
      setStageSize({ width: element.clientWidth, height: element.clientHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const total = cards.length;
  const maxVisibleOffset = stageSize.width <= 480 ? 1 : 2;
  const stepX = stageSize.width <= 400
    ? stageSize.width * 0.38
    : stageSize.width <= 640
      ? stageSize.width * 0.34
      : stageSize.width <= 1024
        ? stageSize.width * 0.25
        : Math.min(stageSize.width * 0.2, 230);
  const stepY = stageSize.height * 0.09;
  const curvature = stageSize.height * 0.025;

  const getPlanetSize = (offset: number, isActive: boolean) => {
    if (isActive) {
      if (stageSize.width <= 400) return PLANET_SIZES.active.tiny;
      if (stageSize.width <= 640) return PLANET_SIZES.active.mobile;
      if (stageSize.width <= 1024) return PLANET_SIZES.active.tablet;
      return PLANET_SIZES.active.desktop;
    }

    if (stageSize.width <= 400) return Math.max(PLANET_SIZES.far.tiny, PLANET_SIZES.nearby.tiny - Math.abs(offset) * 18);
    if (stageSize.width <= 640) return Math.max(PLANET_SIZES.far.mobile, PLANET_SIZES.nearby.mobile - Math.abs(offset) * 16);
    if (stageSize.width <= 1024) return Math.max(PLANET_SIZES.far.tablet, PLANET_SIZES.nearby.tablet - Math.abs(offset) * 18);
    return Math.max(PLANET_SIZES.far.desktop, PLANET_SIZES.nearby.desktop - Math.abs(offset) * 20);
  };

  const move = useCallback((delta: number) => {
    setActiveIndex((current) => {
      const nextIndex = Math.min(Math.max(current + delta, 0), total - 1);
      return nextIndex;
    });
  }, [total]);

  const activeCard = cards[activeIndex] ?? cards[0];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < cards.length - 1;
  const centerX = stageSize.width / 2;
  const centerY = stageSize.height / 2;
  const visiblePlanets = cards
    .map((card, index) => {
      const offset = index - activeIndex;
      const isActive = index === activeIndex;
      const sizePx = getPlanetSize(offset, isActive);
      const planetCenterX = centerX + offset * stepX;
      const planetCenterY = centerY + offset * stepY + offset * offset * curvature;

      return {
        card,
        index,
        offset,
        isActive,
        sizePx,
        centerX: planetCenterX,
        centerY: planetCenterY,
        x: planetCenterX - sizePx / 2,
        y: planetCenterY - sizePx / 2,
      };
    })
    .filter(({ offset }) => Math.abs(offset) <= maxVisibleOffset);
  const orbitPath = visiblePlanets.length > 0
    ? `M ${visiblePlanets[0].centerX} ${visiblePlanets[0].centerY}${visiblePlanets.slice(1).map((planet, index) => {
      const previous = visiblePlanets[index];
      const beforePrevious = visiblePlanets[index - 1] ?? previous;
      const next = visiblePlanets[index + 2] ?? planet;
      const control1X = previous.centerX + (planet.centerX - beforePrevious.centerX) / 6;
      const control1Y = previous.centerY + (planet.centerY - beforePrevious.centerY) / 6;
      const control2X = planet.centerX - (next.centerX - previous.centerX) / 6;
      const control2Y = planet.centerY - (next.centerY - previous.centerY) / 6;

      return ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${planet.centerX} ${planet.centerY}`;
    }).join('')}`
    : '';

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
        className="group relative h-[clamp(22rem,52vh,26rem)] w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 px-2 py-4 outline-none sm:h-[clamp(25rem,56vh,31rem)] sm:px-4 lg:h-[clamp(30rem,62vh,38rem)] lg:px-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.06),_transparent_42%)]" />
        {stageSize.width > 0 && stageSize.height > 0 && (
          <>
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d={orbitPath} fill="none" stroke="rgba(103,232,249,0.2)" strokeWidth="1" strokeDasharray="3 7" strokeLinecap="round" />
            </svg>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.48)_12%,rgba(2,6,23,0)_25%,rgba(2,6,23,0)_75%,rgba(2,6,23,0.48)_88%,rgba(2,6,23,0.96)_100%)]" />
            <div className="absolute inset-x-0 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />
            <div className="absolute left-[14%] top-[18%] h-1.5 w-1.5 rounded-full bg-cyan-200/80 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
            <div className="absolute right-[16%] top-[25%] h-1 w-1 rounded-full bg-slate-300/80" />
            <div className="absolute left-[38%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-cyan-200/60" />

            <div className="absolute inset-0 z-10">
              {visiblePlanets.map(({ card, index, offset, isActive, sizePx, x, y }) => {
                const scale = Math.max(0.76, 1 - 0.11 * Math.abs(offset));
                const opacity = Math.max(0.42, 1 - 0.2 * Math.abs(offset));
                const zIndex = 10 - Math.abs(offset);
                const stateColors = STATE_PALETTE[card.state];

                return (
                  <motion.div
                    key={card.id}
                    initial={false}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 60) move(info.offset.x > 0 ? -1 : 1);
                    }}
                    animate={{ x, y, scale, opacity, zIndex }}
                    transition={{ type: 'spring', stiffness: 125, damping: 22, mass: 0.8 }}
                    className="absolute left-0 top-0"
                    style={{
                      transformOrigin: 'center center',
                      filter: offset === 0 ? 'none' : `blur(${Math.min(Math.abs(offset) * 0.35, 0.7)}px)`,
                    }}
                  >
                  <button
                    type="button"
                    aria-label={`Module ${card.ordre} : ${card.titre}, ${labels[card.state]}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => setActiveIndex(index)}
                    className={`group relative flex items-center justify-center rounded-full border-2 text-white outline-none ring-offset-0 transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                      isActive ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    style={{
                      width: `${sizePx}px`,
                      height: `${sizePx}px`,
                      borderColor: stateColors.border,
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 28% 24%, rgba(255,255,255,0.48), rgba(255,255,255,0.12) 22%, transparent 38%), radial-gradient(circle at 76% 78%, rgba(2,6,23,0.38), transparent 58%), linear-gradient(140deg, ${stateColors.light}, ${stateColors.base} 68%)`,
                        boxShadow: isActive || card.state === 'in_progress' ? `0 0 34px ${stateColors.glow}` : 'none',
                      }}
                    />
                    {card.state === 'completed' && (
                      <span className="absolute inset-0 rounded-full shadow-[inset_0_0_18px_rgba(52,211,153,0.7)]" />
                    )}
                    {(card.state === 'in_progress' || isActive) && (
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
                      <span className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-100/40 bg-emerald-950/80 text-xs font-bold text-emerald-200 sm:right-3 sm:top-3 sm:h-6 sm:w-6">✓</span>
                    )}
                    {card.state === 'available' && (
                      <span className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-indigo-100/40 bg-indigo-950/80 text-xs font-bold text-indigo-100 sm:right-3 sm:top-3 sm:h-6 sm:w-6">↗</span>
                    )}
                    {card.state === 'locked' && (
                      <span className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-slate-400/40 bg-slate-950/90 text-[10px] text-slate-300 sm:right-3 sm:top-3 sm:h-6 sm:w-6 sm:text-xs">🔒</span>
                    )}
                    <span className="relative z-10 text-2xl font-semibold leading-none text-white drop-shadow-[0_1px_3px_rgba(2,6,23,0.8)]">
                      {card.ordre}
                    </span>
                  </button>
                </motion.div>
              );
            })}
            </div>
            {focused && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-slate-950/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200"
                style={{ left: `${centerX}px`, top: `${centerY + getPlanetSize(0, true) / 2 + 18}px` }}
              >
                FOCUS
              </div>
            )}
          </>
        )}
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
