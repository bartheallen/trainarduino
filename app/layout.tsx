import type { Metadata } from 'next';
import './globals.css';
import { DesignSystemProvider } from '@/components/design/DesignSystemProvider';
import { PageTransition } from '@/components/design/PageTransition';
import { CursorGlow } from '@/components/design/CursorGlow';

export const metadata: Metadata = {
  title: 'TrainArduino - Learn Arduino Like Duolingo',
  description: 'Interactive Arduino learning platform with gamification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-[#07111b] text-slate-100 transition-colors duration-400">
        <DesignSystemProvider>
          <CursorGlow />
          <PageTransition>{children}</PageTransition>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
