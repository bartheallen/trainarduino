export const motionTokens = {
  extraFast: { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const },
  fast: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  normal: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  slow: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  floating: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const },
  reveal: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  scale: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  fade: { duration: 0.25, ease: 'easeOut' as const },
  slide: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  signal: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const },
  pulse: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
};
