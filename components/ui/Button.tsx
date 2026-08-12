import { ReactNode } from 'react';
import { PrimitiveButton } from '@/components/design/PrimitiveButton';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Reusable action button with motion feedback and accessible focus styles.
 */
export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  success = false,
  type = 'button',
}: ButtonProps) {
  const primitiveVariant = variant === 'secondary' ? 'secondary' : variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary';

  return (
    <PrimitiveButton variant={primitiveVariant} disabled={disabled} loading={loading} success={success} onClick={onClick} className={className} type={type}>
      {children}
    </PrimitiveButton>
  );
}
