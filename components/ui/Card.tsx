import { ReactNode, MouseEvent } from 'react';
import { PrimitiveCard } from '@/components/design/PrimitiveCard';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * Base card surface for dashboard and module panels.
 */
export function Card({ children, className = '', hoverable = true, onClick }: CardProps) {
  return (
    <div onClick={onClick} className={className}>
      <PrimitiveCard hoverable={hoverable} className={className}>
        {children}
      </PrimitiveCard>
    </div>
  );
}
