import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-pcb-dark text-slate-100 transition-colors duration-400">
        {children}
      </body>
    </html>
  );
}
