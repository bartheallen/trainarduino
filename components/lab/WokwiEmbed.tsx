'use client';

interface WokwiEmbedProps {
  wokwiUrl: string | null | undefined;
}

export function WokwiEmbed({ wokwiUrl }: WokwiEmbedProps) {
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

  return (
    <div className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-slate-950/70">
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
  );
}