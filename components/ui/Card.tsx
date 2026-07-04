import { motion } from 'framer-motion';
import { ReactNode, MouseEvent } from 'react';

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { y: -3, scale: 1.01, boxShadow: '0 18px 35px rgba(0,0,0,0.12)' } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
      className={`rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 ${className}`}
    >
      {children}
    </motion.div>
  );
}
