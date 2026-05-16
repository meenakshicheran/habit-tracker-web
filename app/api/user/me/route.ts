import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function thisMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  return monday;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      xp: true,
      level: true,
      freezeTokens: true,
      lastTokenReset: true,
      onboardingDone: true,
      reminderTime: true,
      notificationsEnabled: true,
      defaultCategory: true,
      name: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Weekly token reset: every Monday give back 1 token (max 3)
  const monday = thisMonday();
  const needsReset = !user.lastTokenReset || user.lastTokenReset < monday;
  if (needsReset && user.freezeTokens < 3) {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        freezeTokens: Math.min(3, user.freezeTokens + 1),
        lastTokenReset: new Date(),
      },
      select: { xp: true, level: true, freezeTokens: true, onboardingDone: true, reminderTime: true, notificationsEnabled: true, defaultCategory: true, name: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({
    xp: user.xp,
    level: user.level,
    freezeTokens: user.freezeTokens,
    onboardingDone: user.onboardingDone,
    reminderTime: user.reminderTime,
    notificationsEnabled: user.notificationsEnabled,
    defaultCategory: user.defaultCategory,
    name: user.name,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowed = ['onboardingDone', 'reminderTime'] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { onboardingDone: true, reminderTime: true },
  });
  return NextResponse.json(updated);
}
