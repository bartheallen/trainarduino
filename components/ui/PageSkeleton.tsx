export function PageSkeleton() {
  return (
    <div className="page-skeleton w-full space-y-6" role="status">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden="true" className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.75)] animate-pulse motion-reduce:animate-none" />
          <div className="h-7 w-2/5 rounded bg-slate-700/60 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="h-4 w-3/5 max-w-xl rounded bg-slate-700/40 animate-pulse motion-reduce:animate-none" />
      </div>

      <div aria-hidden="true" className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className="space-y-5 rounded-lg border border-white/[0.08] bg-white/[0.04] p-5"
          >
            <div className="h-5 w-2/3 rounded bg-slate-700/60 animate-pulse motion-reduce:animate-none" />
            <div className="space-y-3">
              <div className="h-3 w-full rounded bg-slate-700/40 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-4/5 rounded bg-slate-700/40 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-3/5 rounded bg-slate-700/40 animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="h-9 w-2/5 rounded bg-slate-700/50 animate-pulse motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </div>
  );
}