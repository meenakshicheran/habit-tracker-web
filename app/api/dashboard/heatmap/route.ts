import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { addDays, todayISO } from '@/lib/utils';

const CACHE_TTL = 3600; // 1 hour

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cacheKey = `heatmap:${session.user.id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));
  } catch {
    // Redis unavailable — fall through to DB query
  }

  const today = todayISO();
  const yearAgo = addDays(today, -364);

  const [logs, totalHabits] = await Promise.all([
    prisma.habitLog.findMany({
      where: { userId: session.user.id, date: { gte: yearAgo }, completed: true },
      select: { date: true },
    }),
    prisma.habit.count({ where: { userId: session.user.id, archived: false } }),
  ]);

  const countByDate = new Map<string, number>();
  for (const log of logs) {
    countByDate.set(log.date, (countByDate.get(log.date) ?? 0) + 1);
  }

  const days: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  for (let i = 0; i <= 364; i++) {
    const date = addDays(yearAgo, i);
    const count = countByDate.get(date) ?? 0;
    const max = Math.max(1, totalHabits);
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / max;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.5) level = 2;
      else level = 1;
    }
    days.push({ date, count, level });
  }

  const result = { days };

  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch {
    // Redis unavailable — serve result uncached
  }

  return NextResponse.json(result);
}
