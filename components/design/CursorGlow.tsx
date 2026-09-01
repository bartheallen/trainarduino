'use client';

import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef({ x: -360, y: -360 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onPointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX - 180, y: event.clientY - 180 };
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        const glow = glowRef.current;
        if (glow) {
          const { x, y } = positionRef.current;
          glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        frameRef.current = null;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-[60] opacity-70"
      style={{
        background: 'radial-gradient(circle, rgba(50,231,255,0.16) 0%, rgba(50,231,255,0.06) 24%, transparent 56%)',
        maskImage: 'radial-gradient(circle at center, black 20%, transparent 72%)',
        transform: 'translate3d(-360px, -360px, 0)',
      }}
    />
  );
}
