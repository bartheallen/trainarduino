'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const FRAME_COUNT = 300;
const MAX_FRAME_INDEX = FRAME_COUNT - 1;
const MAX_CONCURRENT_LOADS = 6;

const FRAME_URLS = Array.from({ length: FRAME_COUNT }, (_, index) => {
  const frameNumber = String(index + 1).padStart(3, '0');
  return `/images/frames/ezgif-frame-${frameNumber}.jpg`;
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const lerp = (start: number, end: number, amount: number) => start + (end - start) * amount;

async function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

function getDocumentProgress() {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  return clamp(window.scrollY / maxScroll, 0, 1);
}

export function ScrollVideoBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const copperRef = useRef<HTMLDivElement | null>(null);
  const cacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const frameIndicesRef = useRef<number[]>(Array.from({ length: FRAME_COUNT }, (_, index) => index));
  const renderRafRef = useRef<number | null>(null);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const reducedMotion = useReducedMotion();

  const drawImageWithAlpha = useCallback((context: CanvasRenderingContext2D, image: HTMLImageElement, alpha: number, width: number, height: number) => {
    context.save();
    context.globalAlpha = alpha;

    const scale = Math.max(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    context.restore();
  }, []);

  const renderFrameFloat = useCallback((frameFloat: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const nextWidth = Math.max(Math.ceil(width * dpr), 1);
    const nextHeight = Math.max(Math.ceil(height * dpr), 1);

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;

    const frames = frameIndicesRef.current;
    const lowerPosition = clamp(Math.floor(frameFloat), 0, frames.length - 1);
    const upperPosition = clamp(Math.ceil(frameFloat), 0, frames.length - 1);
    const lowerIndex = frames[lowerPosition];
    const upperIndex = frames[upperPosition];
    const findNearestLoadedImage = (index: number) => {
      for (let candidate = index; candidate >= 0; candidate -= 1) {
        const image = cacheRef.current.get(candidate);
        if (image) return image;
      }
      for (let candidate = index + 1; candidate < FRAME_COUNT; candidate += 1) {
        const image = cacheRef.current.get(candidate);
        if (image) return image;
      }
      return undefined;
    };
    const lowerImage = cacheRef.current.get(lowerIndex) ?? findNearestLoadedImage(lowerIndex);
    const upperImage = cacheRef.current.get(upperIndex) ?? findNearestLoadedImage(upperIndex);
    const blend = frameFloat - lowerPosition;

    if (lowerImage && upperImage && lowerImage !== upperImage) {
      drawImageWithAlpha(context, lowerImage, 1, width, height);
      drawImageWithAlpha(context, upperImage, blend, width, height);
      return;
    }

    const primaryImage = lowerImage ?? upperImage;
    if (primaryImage) {
      drawImageWithAlpha(context, primaryImage, 1, width, height);
    }
  }, [drawImageWithAlpha]);

  const stepAnimation = useCallback(() => {
    renderRafRef.current = null;
    const damping = reducedMotion ? 0.22 : 0.09;
    const targetFrame = targetFrameRef.current;
    const nextFrame = lerp(currentFrameRef.current, targetFrame, damping);
    currentFrameRef.current = nextFrame;

    renderFrameFloat(nextFrame);

    if (Math.abs(targetFrame - nextFrame) > 0.02) {
      renderRafRef.current = window.requestAnimationFrame(stepAnimation);
    } else {
      renderRafRef.current = null;
    }
  }, [reducedMotion, renderFrameFloat]);

  const scheduleAnimation = useCallback(() => {
    if (renderRafRef.current === null) {
      renderRafRef.current = window.requestAnimationFrame(stepAnimation);
    }
  }, [stepAnimation]);

  useEffect(() => {
    let cancelled = false;
    const mountedAt = performance.now();
    cacheRef.current.clear();

    const cacheLoadedFrame = (index: number, image: HTMLImageElement) => {
      if (cancelled) return;
      cacheRef.current.set(index, image);

      if (reducedMotion) {
        currentFrameRef.current = 0;
        targetFrameRef.current = 0;
        renderFrameFloat(0);
      } else {
        scheduleAnimation();
      }
    };

    if (reducedMotion) {
      frameIndicesRef.current = [0];
      currentFrameRef.current = 0;
      targetFrameRef.current = 0;
    } else {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      const sampleEveryOther = window.innerWidth < 768 || connection?.saveData === true;
      const frameStep = sampleEveryOther ? 2 : 1;
      const frameIndices = Array.from({ length: Math.ceil(FRAME_COUNT / frameStep) }, (_, index) => index * frameStep);
      if (frameIndices[frameIndices.length - 1] !== MAX_FRAME_INDEX) {
        frameIndices.push(MAX_FRAME_INDEX);
      }
      frameIndicesRef.current = frameIndices;
      targetFrameRef.current = getDocumentProgress() * (frameIndices.length - 1);
    }

    const framePositions = frameIndicesRef.current.map((_, position) => position);
    const passPositions = [
      framePositions.filter((position) => position % 8 === 0 || position === framePositions.length - 1),
      framePositions.filter((position) => position % 4 === 0),
      framePositions.filter((position) => position % 2 === 0),
      framePositions,
    ];

    const loadPass = async (positions: number[], passNumber: number) => {
      if (cancelled) return;

      const targetPosition = targetFrameRef.current;
      const pending = positions
        .filter((position) => !cacheRef.current.has(frameIndicesRef.current[position]))
        .sort((left, right) => Math.abs(left - targetPosition) - Math.abs(right - targetPosition));
      let nextIndex = 0;
      let loadedCount = 0;

      const worker = async () => {
        while (!cancelled && nextIndex < pending.length) {
          const position = pending[nextIndex++];
          if (cancelled) return;
          const frameIndex = frameIndicesRef.current[position];

          try {
            const image = await preloadImage(FRAME_URLS[frameIndex]);
            if (cancelled) return;

            try {
              await image.decode();
            } catch {
              // The image is already loaded; use it even if explicit decoding fails.
            }

            if (cancelled) return;
            cacheLoadedFrame(frameIndex, image);
            loadedCount += 1;
          } catch {
            // Ignore failed frames and continue with the rest of the pass.
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(MAX_CONCURRENT_LOADS, pending.length) }, () => worker()),
      );

      if (!cancelled && process.env.NODE_ENV !== 'production') {
        const elapsedSeconds = (performance.now() - mountedAt) / 1000;
        console.info(`frames passe ${passNumber}/4 : ${loadedCount} images en ${elapsedSeconds.toFixed(1)} s`);
      }
    };

    const preloadFramesByPass = async () => {
      for (let passIndex = 0; passIndex < passPositions.length; passIndex += 1) {
        if (cancelled) return;
        await loadPass(passPositions[passIndex], passIndex + 1);
      }
    };

    void preloadFramesByPass();
    return () => {
      cancelled = true;
    };
  }, [reducedMotion, renderFrameFloat, scheduleAnimation]);

  useEffect(() => {
    if (reducedMotion) {
      currentFrameRef.current = 0;
      targetFrameRef.current = 0;
      return;
    }

    const syncScrollTarget = () => {
      const progress = getDocumentProgress();
      targetFrameRef.current = progress * (frameIndicesRef.current.length - 1);
      scheduleAnimation();
    };

    syncScrollTarget();
    window.addEventListener('scroll', syncScrollTarget, { passive: true });
    window.addEventListener('resize', syncScrollTarget);

    return () => {
      window.removeEventListener('scroll', syncScrollTarget);
      window.removeEventListener('resize', syncScrollTarget);
    };
  }, [reducedMotion, scheduleAnimation]);

  useEffect(() => {
    const handleResize = () => {
      if (reducedMotion) {
        renderFrameFloat(0);
      } else {
        scheduleAnimation();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, renderFrameFloat, scheduleAnimation]);

  useEffect(() => {
    if (!reducedMotion && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      const handlePointerMove = (event: PointerEvent) => {
        if (!spotlightRef.current) {
          return;
        }

        const offsetX = event.clientX - window.innerWidth / 2;
        const offsetY = event.clientY - window.innerHeight / 2;
        spotlightRef.current.style.transform = `translate3d(${offsetX * 0.14}px, ${offsetY * 0.14}px, 0)`;
        spotlightRef.current.style.opacity = '0.06';

        if (copperRef.current) {
          const copperShift = getDocumentProgress() * 28;
          copperRef.current.style.transform = `translate3d(${(offsetX * 0.08) + copperShift * 0.25}px, ${(offsetY * 0.06) - copperShift * 0.1}px, 0)`;
        }
      };

      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
      };
    }

    return undefined;
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden"
      style={{
        backgroundImage: "url('/images/frames/ezgif-frame-001.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0)_0%,_rgba(15,23,42,0.10)_36%,_rgba(2,6,23,0.55)_100%)]" />
      <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at center, rgba(148,163,184,0.08), transparent 58%)' }} />
      <div ref={spotlightRef} className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-3xl transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.12) 0%, rgba(34,211,238,0.06) 20%, transparent 68%)' }} />
      <div ref={copperRef} className="absolute inset-0 opacity-[0.035]" style={{ background: 'linear-gradient(115deg, transparent 0%, rgba(182,120,75,0.12) 30%, rgba(255,255,255,0.04) 42%, transparent 52%, rgba(111,76,52,0.08) 68%, transparent 100%)' }} />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 0.7px, transparent 0.8px)', backgroundSize: '12px 12px' }} />
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(2,6,23,0.45),inset_0_0_14px_rgba(2,6,23,0.375)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.08),_transparent_38%)]" />
    </div>
  );
}
