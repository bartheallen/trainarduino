'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from 'framer-motion';

export function RouteProgress() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const previousPathname = useRef(pathname);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    if (resetTimer.current) clearTimeout(resetTimer.current);

    progressRef.current = 100;
    setProgress(100);
    setActive(true);
    resetTimer.current = setTimeout(() => {
      setActive(false);
      resetTimer.current = setTimeout(() => {
        progressRef.current = 0;
        setProgress(0);
      }, 300);
    }, 300);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const anchor = event.target.closest('a');
      const href = anchor?.getAttribute('href');
      if (
        !anchor ||
        !href?.startsWith('/') ||
        anchor.target.toLowerCase() === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      const destination = new URL(href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === pathname
      ) {
        return;
      }

      if (progressTimer.current) clearInterval(progressTimer.current);
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);

      progressRef.current = 30;
      setProgress(30);
      setActive(true);

      if (!prefersReducedMotion) {
        progressTimer.current = setInterval(() => {
          const nextProgress = Math.min(
            90,
            progressRef.current + Math.max(1, Math.ceil((90 - progressRef.current) * 0.12)),
          );
          progressRef.current = nextProgress;
          setProgress(nextProgress);
          if (nextProgress >= 90 && progressTimer.current) {
            clearInterval(progressTimer.current);
            progressTimer.current = null;
          }
        }, 200);
      }

      watchdogTimer.current = setTimeout(() => {
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = null;
        setActive(false);
        resetTimer.current = setTimeout(() => {
          progressRef.current = 0;
          setProgress(0);
        }, 300);
      }, 10000);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, prefersReducedMotion]);

  useEffect(
    () => () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-[2px]"
      style={{
        width: prefersReducedMotion ? (active ? '100%' : '0%') : `${progress}%`,
        opacity: active ? 1 : 0,
        background: 'linear-gradient(90deg, #32e7ff, #4f8cff)',
        boxShadow: '0 0 8px rgba(50, 231, 255, 0.65)',
        transition: prefersReducedMotion
          ? 'opacity 300ms ease'
          : 'width 200ms ease-out, opacity 300ms ease',
      }}
    />
  );
}