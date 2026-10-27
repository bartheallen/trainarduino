'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { preload } from 'react-dom';
import { ScrollVideoBackground } from '@/components/ScrollVideoBackground';

const ArduinoScene = dynamic(
  () => import('@/components/ArduinoScene').then((module) => module.ArduinoScene),
  { ssr: false },
);

const OPAQUE_LAYOUT_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/positioning-test',
  '/dashboard',
  '/modules',
  '/dashboard-group',
  '/settings',
  '/challenges',
];

function hasOpaqueLayout(pathname: string) {
  return OPAQUE_LAYOUT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function RouteBackground() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  if (pathname === '/') {
    preload('/images/frames/ezgif-frame-001.jpg', { as: 'image' });
    return (
      <>
        <ScrollVideoBackground />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[-1] hidden md:block"
          style={{
            background: 'linear-gradient(90deg, rgba(2, 8, 15, 0.72) 0%, rgba(2, 8, 15, 0.25) 48%, transparent 65%), linear-gradient(180deg, rgba(2, 8, 15, 0.6) 0%, transparent 12%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[-1] bg-[rgba(2,8,15,0.45)] md:hidden"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[-1] md:hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(2, 8, 15, 0.24) 0%, transparent 18%, transparent 82%, rgba(2, 8, 15, 0.18) 100%)',
          }}
        />
      </>
    );
  }

  if (hasOpaqueLayout(pathname)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      <ArduinoScene />
    </div>
  );
}