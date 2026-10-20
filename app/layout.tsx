import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { DesignSystemProvider } from '@/components/design/DesignSystemProvider';
import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { RouteBackground } from '@/components/design/RouteBackground';
import { RouteProgress } from '@/components/design/RouteProgress';
import { getLocale, getServerDictionary } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === 'en'
    ? {
        title: 'TrainArduino: learn electronics with Arduino',
        description: 'Interactive platform to learn electronics and Arduino step by step, with simulation, exercises and an AI mentor.',
      }
    : {
        title: 'TrainArduino : apprendre l\'électronique avec Arduino',
        description: 'Plateforme interactive pour apprendre l\'électronique et Arduino pas à pas, avec simulation, exercices et mentor IA.',
      };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const dict = await getServerDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="relative min-h-screen bg-[#07111b] text-slate-100 transition-colors duration-400">
        <DesignSystemProvider>
          <LocaleProvider locale={locale} dict={dict}>
            <RouteBackground />
            <RouteProgress />
            <div className="relative z-10">
              {children}
            </div>
            <Analytics />
            <SpeedInsights />
          </LocaleProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
