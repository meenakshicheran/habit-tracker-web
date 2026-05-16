import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays, todayISO } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habit = await prisma.habit.findFirst({
    where: { id, userId: session.user.id },
    include: { streak: true },
  });
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const today = todayISO();
  const day84Ago = addDays(today, -83);

  const [recentLogs, totalCount, journals] = await Promise.all([
    prisma.habitLog.findMany({
      where: { habitId: id, date: { gte: day84Ago }, completed: true },
      select: { date: true },
    }),
    prisma.habitLog.count({ where: { habitId: id, completed: true } }),
    prisma.journalEntry.findMany({
      where: { habitId: id, userId: session.user.id },
      select: { date: true, content: true },
      orderBy: { date: 'desc' },
    }),
  ]);

  const completedSet = new Set(recentLogs.map((l) => l.date));

  const last84Days = Array.from({ length: 84 }, (_, i) => {
    const date = addDays(today, -(83 - i));
    return { date, completed: completedSet.has(date) };
  });

  const last7Days = last84Days.slice(-7);

  const weeklyStats = Array.from({ length: 4 }, (_, i) => {
    const weekStart = addDays(today, -(i + 1) * 7);
    const weekEnd = addDays(today, -i * 7);
    const count = [...completedSet].filter((d) => d >= weekStart && d < weekEnd).length;
    return { week: i + 1, count, rate: Math.round((count / 7) * 100) };
  }).reverse();

  const daysSinceCreated = Math.max(
    1,
    Math.ceil((Date.now() - new Date(habit.createdAt).getTime()) / 86400000)
  );
  const completionRate = Math.min(100, Math.round((totalCount / daysSinceCreated) * 100));

  return NextResponse.json({
    habit,
    streak: habit.streak ?? { current: 0, longest: 0 },
    totalCompletions: totalCount,
    completionDates: [...completedSet].sort(),
    weeklyStats,
    last84Days,
    last7Days,
    completionRate,
    journals,
  });
}
