'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function CursorGlow() {
  const shouldReduceMotion = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60] opacity-70"
      animate={{ x: position.x - 180, y: position.y - 180 }}
      transition={{ type: 'spring', stiffness: 90, damping: 24, mass: 0.3 }}
      style={{
        background: 'radial-gradient(circle, rgba(50,231,255,0.16) 0%, rgba(50,231,255,0.06) 24%, transparent 56%)',
        maskImage: 'radial-gradient(circle at center, black 20%, transparent 72%)',
      }}
    />
  );
}
