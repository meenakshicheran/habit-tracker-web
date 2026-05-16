'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { key: 'N', description: 'New habit' },
  { key: '1–9', description: 'Toggle nth habit today' },
  { key: '?', description: 'Show this cheatsheet' },
  { key: 'Esc', description: 'Close any modal' },
];

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-72 bg-surface border border-border rounded-2xl p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</span>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {SHORTCUTS.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{description}</span>
                  <kbd className="px-2 py-0.5 rounded-md bg-surface-raised border border-border text-xs font-mono text-text-primary">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
