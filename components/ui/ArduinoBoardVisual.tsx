'use client';

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

/** A lightweight, CSS/SVG Arduino-inspired board used as a visual cue, not a product logo. */
export function ArduinoBoardVisual({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const parallaxOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const smoothY = useSpring(parallaxY, { stiffness: 120, damping: 24, mass: 0.5 });
  const smoothScale = useSpring(parallaxScale, { stiffness: 120, damping: 24, mass: 0.5 });
  const smoothOpacity = useSpring(parallaxOpacity, { stiffness: 120, damping: 24, mass: 0.5 });

  return (
    <motion.div
      aria-hidden="true"
      className={`relative aspect-[1.55] w-full max-w-[26rem] select-none ${className}`}
      style={reduced ? undefined : { y: smoothY, scale: smoothScale, opacity: smoothOpacity }}
    >
      <motion.div
        className="absolute inset-0"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-[1.6rem] border border-cyan-200/40 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-700 shadow-[0_28px_70px_rgba(8,145,178,0.25)]" />
        <div className="absolute inset-3 rounded-[1.25rem] border border-slate-950/30 bg-cyan-950/25" />
        <div className="absolute left-[10%] top-[17%] h-[34%] w-[25%] rounded-lg border-4 border-slate-900 bg-slate-800 shadow-inner" />
        <div className="absolute left-[14%] top-[23%] h-2 w-[17%] rounded-full bg-slate-600" />
        <div className="absolute right-[10%] top-[15%] grid grid-cols-2 gap-1.5">
          {Array.from({ length: compact ? 4 : 8 }).map((_, index) => <span key={index} className="h-3 w-3 rounded-sm bg-amber-200 shadow-[0_0_8px_rgba(253,230,138,.8)]" />)}
        </div>
        <div className="absolute bottom-[13%] left-[12%] flex gap-1.5">
          {Array.from({ length: compact ? 6 : 12 }).map((_, index) => <span key={index} className="h-4 w-1.5 rounded bg-slate-950/90" />)}
        </div>
        <div className="absolute bottom-[16%] right-[14%] h-8 w-8 rounded-full border-2 border-white/60 bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,.95)]" />
        <p className="absolute bottom-[42%] left-[42%] font-mono text-[clamp(.52rem,2vw,.85rem)] font-bold tracking-[.18em] text-cyan-50">ARDUINO</p>
        <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 310 200" fill="none">
          <path d="M12 145H88V105H128M198 42H265V98H294M170 165V128H238" stroke="rgba(207,250,254,.75)" strokeWidth="2" />
          <circle cx="128" cy="105" r="4" fill="#fef3c7" /><circle cx="265" cy="98" r="4" fill="#fef3c7" /><circle cx="238" cy="128" r="4" fill="#fef3c7" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export function ArduinoLedLoader({ label = 'Connexion au circuit…' }: { label?: string }) {
  const reduced = useReducedMotion();
  return <div className="flex flex-col items-center gap-3 py-2 text-center">
    <ArduinoBoardVisual compact className="max-w-[11rem]" />
    <div className="flex items-center gap-2 text-xs font-medium text-cyan-100"><motion.span className="h-2.5 w-2.5 rounded-full bg-emerald-300" animate={reduced ? undefined : { opacity: [.25, 1, .25], boxShadow: ['0 0 0 rgba(110,231,183,0)', '0 0 16px rgba(110,231,183,1)', '0 0 0 rgba(110,231,183,0)'] }} transition={{ duration: .8, repeat: Infinity }} />{label}</div>
  </div>;
}
