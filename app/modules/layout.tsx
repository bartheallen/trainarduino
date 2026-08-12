import Link from 'next/link';
import { SignoutButton } from '@/components/SignoutButton';
import { AnimatedPcbBackground } from '@/components/ui/AnimatedPcbBackground';

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.12),_transparent_28%),linear-gradient(135deg,_#07111b_0%,_#0d1722_100%)] text-slate-100">
      <AnimatedPcbBackground className="opacity-70" />
      <nav className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">TrainArduino</p>
            <h1 className="mt-1 text-xl font-semibold text-white">Module lab</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-slate-800/90 hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard#parcours-modules" className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3.5 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15">
              Modules
            </Link>
            <SignoutButton />
          </div>
        </div>
      </nav>
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
