import { AnimatedPcbBackground } from '@/components/ui/AnimatedPcbBackground';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.14),_transparent_28%),linear-gradient(135deg,_#07111b_0%,_#0d1722_100%)] text-slate-100">
      <AnimatedPcbBackground className="opacity-70" />
      <div className="absolute left-3 top-3 h-20 w-20 rounded-full border border-cyan-400/20 bg-cyan-400/10 blur-2xl sm:left-6 sm:top-6 sm:h-24 sm:w-24" />
      <div className="absolute bottom-6 right-4 h-20 w-20 rounded-full border border-blue-400/20 bg-blue-400/10 blur-2xl sm:bottom-8 sm:right-8 sm:h-24 sm:w-24" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
