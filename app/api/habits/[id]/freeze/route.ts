import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateStreak } from '@/lib/streak';
import { addDays, todayISO } from '@/lib/utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [habit, user] = await Promise.all([
    prisma.habit.findFirst({ where: { id, userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { freezeTokens: true } }),
  ]);

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!user || user.freezeTokens <= 0) {
    return NextResponse.json({ error: 'No freeze tokens remaining' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  // Default to yesterday — the most common use case is saving a streak that just broke
  const date: string = body.date ?? addDays(todayISO(), -1);

  // Idempotent: don't deduct another token if this date is already frozen
  const alreadyFrozen = await prisma.streakFreeze.findUnique({
    where: { habitId_date: { habitId: id, date } },
  });
  if (alreadyFrozen) {
    return NextResponse.json({ freezeTokens: user.freezeTokens });
  }

  await prisma.$transaction([
    prisma.streakFreeze.create({ data: { habitId: id, userId: session.user.id, date } }),
    prisma.freezeEvent.create({ data: { userId: session.user.id, habitId: id, date } }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { freezeTokens: { decrement: 1 } },
    }),
  ]);

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { freezeTokens: true },
  });

  await recalculateStreak(id);

  return NextResponse.json({ freezeTokens: updated!.freezeTokens });
}
