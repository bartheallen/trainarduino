import React from 'react';

export default function Avatar({ src, alt, size = 48 }: { src?: string; alt?: string; size?: number }) {
  const style = { width: size, height: size } as React.CSSProperties;
  return (
    <div className="rounded-full overflow-hidden bg-slate-700" style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || 'Avatar'} style={style} />
      ) : (
        <div className="flex items-center justify-center h-full text-white">{alt?.charAt(0) ?? 'U'}</div>
      )}
    </div>
  );
}
