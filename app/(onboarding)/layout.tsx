import { AnimatedPcbBackground } from '@/components/ui/AnimatedPcbBackground';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(50,231,255,0.12),_transparent_28%),linear-gradient(135deg,_#07111b_0%,_#0d1722_100%)] text-slate-100">
      <AnimatedPcbBackground className="opacity-70" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
