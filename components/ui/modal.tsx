'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className={cn('relative w-full rounded-2xl p-6 z-10 overflow-y-auto', sizeClasses[size])}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              maxHeight: 'calc(100dvh - 48px)',
            }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {(title || description) && (
              <div className="mb-5">
                {title && (
                  <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-text-secondary">{description}</p>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
