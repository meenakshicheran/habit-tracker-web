import { prisma } from './prisma';
import { todayISO, addDays } from './utils';

export async function recalculateStreak(habitId: string): Promise<{ current: number; longest: number }> {
  const [logs, freezes] = await Promise.all([
    prisma.habitLog.findMany({
      where: { habitId, completed: true },
      select: { date: true },
    }),
    prisma.streakFreeze.findMany({
      where: { habitId },
      select: { date: true },
    }),
  ]);

  // Frozen dates count as completed — merge both sets
  const dateSet = new Set([...logs.map((l) => l.date), ...freezes.map((f) => f.date)]);

  if (dateSet.size === 0) {
    await prisma.streak.upsert({
      where: { habitId },
      create: { habitId, current: 0, longest: 0, lastChecked: todayISO() },
      update: { current: 0, lastChecked: todayISO() },
    });
    return { current: 0, longest: 0 };
  }

  const today = todayISO();
  const yesterday = addDays(today, -1);

  // Current streak: count backwards from today or yesterday
  let current = 0;
  let cursor: string | null = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null;

  if (cursor) {
    while (dateSet.has(cursor)) {
      current++;
      cursor = addDays(cursor, -1);
    }
  }

  // Longest streak: scan all dates sorted ascending
  const sorted = [...dateSet].sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  await prisma.streak.upsert({
    where: { habitId },
    create: { habitId, current, longest, lastChecked: today },
    update: { current, longest: Math.max(longest, current), lastChecked: today },
  });

  return { current, longest };
}
