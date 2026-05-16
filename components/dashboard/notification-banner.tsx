'use client';

import { Bell, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { HabitSummaryItem } from '@/lib/hooks/useHabits';

interface NotificationBannerProps {
  habits: HabitSummaryItem[];
}

function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}

export function NotificationBanner({ habits }: NotificationBannerProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  // Schedule notifications for habits with reminderTime that aren't done yet
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (habits.length === 0) return;

    const scheduled = JSON.parse(sessionStorage.getItem('hf_notif_scheduled') ?? '[]') as string[];
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const habit of habits) {
      if (!habit.reminderTime || habit.completedToday) continue;
      const key = `${habit.id}_${habit.reminderTime}`;
      if (scheduled.includes(key)) continue;

      const delay = msUntilTime(habit.reminderTime);
      if (delay > 24 * 60 * 60 * 1000) continue; // skip if more than 24h away

      const t = setTimeout(() => {
        new Notification('HabitFlow', {
          body: `Time for: ${habit.title}`,
          icon: '/favicon.ico',
        });
      }, delay);

      timers.push(t);
      scheduled.push(key);
    }

    sessionStorage.setItem('hf_notif_scheduled', JSON.stringify(scheduled));
    return () => timers.forEach(clearTimeout);
  }, [habits]);

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (dismissed || permission === null || permission === 'granted') return null;

  return (
    <div className="mb-4 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border text-sm">
      <Bell className="w-4 h-4 text-text-muted flex-shrink-0" />
      <p className="flex-1 text-text-secondary text-xs">
        Enable notifications to get habit reminders at your set times.
      </p>
      {permission === 'default' && (
        <button
          onClick={requestPermission}
          className="text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ background: 'var(--accent)20', color: 'var(--accent)' }}
        >
          Enable
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
