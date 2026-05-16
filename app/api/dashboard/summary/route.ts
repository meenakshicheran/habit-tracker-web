import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { mapHabit, springFetch } from '@/lib/spring';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await springFetch('/api/habits', session.user.email!);
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch habits' }, { status: res.status });

  const raw = await res.json();
  const habits = raw.map(mapHabit);

  const completedToday = habits.filter((h: ReturnType<typeof mapHabit>) => h.completedToday).length;
  const totalHabits = habits.length;
  const streaks = habits.map((h: ReturnType<typeof mapHabit>) => h.streak.current);
  const averageStreak = streaks.length
    ? Math.round(streaks.reduce((a: number, b: number) => a + b, 0) / streaks.length)
    : 0;
  const longestStreak = streaks.length ? Math.max(...streaks) : 0;

  return NextResponse.json({
    habits,
    stats: { totalHabits, completedToday, averageStreak, longestStreak },
  });
}
