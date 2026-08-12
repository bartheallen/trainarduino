import { ReactNode } from 'react';

interface PrimitiveSectionProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PrimitiveSection({ title, children, className = '' }: PrimitiveSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {title ? <div className="flex items-center justify-between">{title}</div> : null}
      {children}
    </section>
  );
}
