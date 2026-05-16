'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewHabit?: () => void;
  onToggleNth?: (n: number) => void;
  onShowShortcuts?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable;

      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      if (isTyping) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handlers.onNewHabit?.();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        handlers.onShowShortcuts?.();
        return;
      }

      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        handlers.onToggleNth?.(n - 1); // 0-indexed
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
