import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { getLevelInfo } from '@/lib/gamification';
import { prisma } from '@/lib/prisma';

// Returns the ISO date of the most recent Monday (week anchor)
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun…6=Sat
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

// Rotating challenge templates — index by ISO week number so they cycle
const TEMPLATES = [
  { title: 'Consistency Week', description: 'Complete all your habits for 5 days this week.', targetDays: 5, xpReward: 100 },
  { title: 'Perfect Week', description: 'Complete all your habits every single day this week.', targetDays: 7, xpReward: 150 },
  { title: 'Halfway Hero', description: 'Complete all your habits for at least 4 days this week.', targetDays: 4, xpReward: 75 },
  { title: 'Momentum Builder', description: 'Hit your habits 5 days in a row at any point this week.', targetDays: 5, xpReward: 100 },
];

function weekNumber(weekStart: string): number {
  const d = new Date(weekStart);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

// Count days this week on which the user completed ALL of their active habits
async function countFullDaysThisWeek(userId: string, weekStart: string): Promise<number> {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    select: { id: true },
  });
  if (habits.length === 0) return 0;
  const habitIds = habits.map((h) => h.id);

  const logs = await prisma.habitLog.findMany({
    where: {
      userId,
      habitId: { in: habitIds },
      date: { gte: weekStart, lte: weekEndStr },
      completed: true,
    },
    select: { date: true },
  });

  // Group by date, count completions per day
  const byDate = new Map<string, number>();
  for (const log of logs) {
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + 1);
  }

  // A "full day" = completed all active habits that day
  let fullDays = 0;
  for (const count of byDate.values()) {
    if (count >= habitIds.length) fullDays++;
  }
  return fullDays;
}

// ─── GET /api/challenges/weekly ──────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const weekStart = currentWeekStart();
  const template = TEMPLATES[weekNumber(weekStart) % TEMPLATES.length];

  // Auto-create challenge for the current week if it doesn't exist yet
  const challenge = await prisma.weeklyChallenge.upsert({
    where: { weekStart },
    create: { weekStart, ...template },
    update: {},
  });

  const participation = await prisma.userWeeklyChallenge.findUnique({
    where: { userId_challengeId: { userId: session.user.id, challengeId: challenge.id } },
  });

  const daysCompleted = await countFullDaysThisWeek(session.user.id, weekStart);
  const eligible = daysCompleted >= challenge.targetDays;

  return NextResponse.json({
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      targetDays: challenge.targetDays,
      xpReward: challenge.xpReward,
      weekStart: challenge.weekStart,
    },
    progress: {
      daysCompleted,
      claimed: participation?.claimedAt != null,
      eligible,
    },
  });
}

// ─── POST /api/challenges/weekly ─────────────────────────────────────────────

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const weekStart = currentWeekStart();

  const challenge = await prisma.weeklyChallenge.findUnique({ where: { weekStart } });
  if (!challenge) return NextResponse.json({ error: 'No challenge this week' }, { status: 404 });

  const existing = await prisma.userWeeklyChallenge.findUnique({
    where: { userId_challengeId: { userId: session.user.id, challengeId: challenge.id } },
  });
  if (existing?.claimedAt) {
    return NextResponse.json({ error: 'Already claimed' }, { status: 400 });
  }

  const daysCompleted = await countFullDaysThisWeek(session.user.id, weekStart);
  if (daysCompleted < challenge.targetDays) {
    return NextResponse.json({ error: 'Challenge not yet complete' }, { status: 400 });
  }

  // Record claim + award XP
  await prisma.userWeeklyChallenge.upsert({
    where: { userId_challengeId: { userId: session.user.id, challengeId: challenge.id } },
    create: { userId: session.user.id, challengeId: challenge.id, claimedAt: new Date() },
    update: { claimedAt: new Date() },
  });

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true },
  });
  const newXp = (current?.xp ?? 0) + challenge.xpReward;
  const newLevel = getLevelInfo(newXp).current.level;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { xp: newXp, level: newLevel },
    select: { xp: true, level: true, freezeTokens: true },
  });

  return NextResponse.json(updated);
}
