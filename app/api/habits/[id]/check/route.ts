import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { XP_PER_COMPLETION, getLevelInfo } from '@/lib/gamification';
import { prisma } from '@/lib/prisma';
import { springFetch } from '@/lib/spring';
import { todayISO } from '@/lib/utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const res = await springFetch(`/api/habits/${id}/complete`, session.user.email!, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to complete habit' }, { status: res.status });
  const habit = await res.json();

  const completed = habit.completedToday as boolean;
  const streak = { current: habit.currentStreak ?? 0, longest: habit.longestStreak ?? 0 };
  const date = todayISO();

  // Gamification stays in Prisma
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true },
  });
  const newXp = Math.max(0, (current?.xp ?? 0) + XP_PER_COMPLETION);
  const newLevel = getLevelInfo(newXp).current.level;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { xp: newXp, level: newLevel },
    select: { xp: true, level: true, freezeTokens: true },
  });

  return NextResponse.json({ completed, date, streak, ...updated });
}
