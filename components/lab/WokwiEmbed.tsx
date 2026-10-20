'use client';

import { useState } from 'react';

interface WokwiEmbedProps {
  wokwiUrl: string | null | undefined;
}

export function WokwiEmbed({ wokwiUrl }: WokwiEmbedProps) {
  const [expanded, setExpanded] = useState(false);
  if (!wokwiUrl) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-[1.15rem] border border-dashed border-white/10 bg-slate-950/70 p-4 text-center">
        <p className="text-sm text-slate-400">Aucun circuit Wokwi lié à cet exercice pour le moment.</p>
        <p className="text-xs text-slate-500">Ajoutez une URL Wokwi dans la colonne wokwi_url de l&apos;exercice.</p>
      </div>
    );
  }

  const embedUrl = wokwiUrl.includes('?')
    ? `${wokwiUrl}&embed=1`
    : `${wokwiUrl}?embed=1`;

  const simulation = <iframe
    src={embedUrl}
    width="100%"
    height="100%"
    loading="lazy"
    allow="clipboard-read; clipboard-write; fullscreen"
    style={{ border: 0 }}
    title="Wokwi Arduino Simulation"
  />;
  return <>
    <div className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-slate-300">Wokwi · circuit et code</span>
        <button type="button" onClick={() => setExpanded(true)} className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">⛶ Agrandir</button>
      </div>
      <iframe
        src={embedUrl}
        width="100%"
        height="400"
        loading="lazy"
        allow="clipboard-read; clipboard-write"
        style={{ border: 0 }}
        title="Wokwi Arduino Simulation"
      />
    </div>
    {expanded && <div className="fixed inset-0 z-[100] bg-slate-950 p-2 sm:p-5">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><p className="font-semibold text-white">Laboratoire Wokwi</p><p className="text-xs text-slate-400">Écrivez et câblez confortablement, puis revenez valider votre module.</p></div><button type="button" onClick={() => setExpanded(false)} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white">Réduire</button></div>
        <div className="min-h-0 flex-1">{simulation}</div>
      </div>
    </div>}
  </>;
}
