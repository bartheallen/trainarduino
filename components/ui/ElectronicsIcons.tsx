export function LedIndicator({ className = '' }: { className?: string }) {
  return <span className={`inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.7)] ${className}`} />;
}

export function CircuitChipIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4V1M16 4V1M8 23V20M16 23V20M4 8H1M4 16H1M23 8h-3M23 16h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 8h8v8H8z" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

export function SignalWaveIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12h3l2-4 3 8 3-4 2 2h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OscilloscopeDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-copper-400/50 to-transparent" />
      <LedIndicator />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
    </div>
  );
}
