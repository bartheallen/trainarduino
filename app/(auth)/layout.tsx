import { AnimatedPcbBackground } from '@/components/ui/AnimatedPcbBackground';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.14),_transparent_28%),linear-gradient(135deg,_#07111b_0%,_#0d1722_100%)] text-slate-100">
      <AnimatedPcbBackground className="opacity-70" />
      <div className="absolute left-6 top-6 h-24 w-24 rounded-full border border-cyan-400/20 bg-cyan-400/10 blur-2xl" />
      <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full border border-blue-400/20 bg-blue-400/10 blur-2xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
