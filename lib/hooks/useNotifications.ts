'use client';

import { useEffect } from 'react';
import type { HabitSummaryItem, UserStats } from './useHabits';

export function useHabitNotifications(
  habits: HabitSummaryItem[] | undefined,
  userStats: UserStats | undefined
) {
  useEffect(() => {
    if (!habits || !userStats?.notificationsEnabled) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const SESSION_KEY = 'scheduledNotifications';
    const scheduled: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]');
    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = new Date();

    for (const habit of habits) {
      if (habit.completedToday) continue;
      const timeStr = habit.reminderTime ?? userStats.reminderTime ?? null;
      if (!timeStr || scheduled.includes(habit.id)) continue;

      const [h, m] = timeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      const ms = target.getTime() - now.getTime();

      if (ms > 0) {
        timers.push(
          setTimeout(() => {
            new Notification('HabitFlow', {
              body: `Time for: ${habit.title}`,
              icon: '/icon.png',
            });
          }, ms)
        );
        scheduled.push(habit.id);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(scheduled));
      }
    }

    return () => timers.forEach(clearTimeout);
  }, [habits, userStats]);
}
