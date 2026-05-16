import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PACKS = {
  morning: [
    { title: 'Wake up early', icon: '☀️', color: '#f97316', category: 'Health' },
    { title: 'Drink water', icon: '💧', color: '#3b82f6', category: 'Health' },
    { title: 'Meditate', icon: '🧘', color: '#a855f7', category: 'Mindfulness' },
    { title: 'Stretch', icon: '🤸', color: '#22c55e', category: 'Fitness' },
    { title: 'Journal', icon: '📓', color: '#eab308', category: 'Mindfulness' },
  ],
  deepwork: [
    { title: 'No phone 1hr', icon: '📵', color: '#ef4444', category: 'Productivity' },
    { title: 'Focus block', icon: '🎯', color: '#f97316', category: 'Productivity' },
    { title: 'Review todos', icon: '✅', color: '#22c55e', category: 'Productivity' },
    { title: 'Read 20 pages', icon: '📚', color: '#3b82f6', category: 'Learning' },
  ],
  athlete: [
    { title: 'Workout', icon: '💪', color: '#f97316', category: 'Fitness' },
    { title: 'Protein intake', icon: '🥗', color: '#22c55e', category: 'Health' },
    { title: 'Sleep 8hrs', icon: '😴', color: '#a855f7', category: 'Health' },
    { title: 'Stretch', icon: '🤸', color: '#3b82f6', category: 'Fitness' },
  ],
} as const;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pack } = await req.json().catch(() => ({}));
  if (!pack || !(pack in PACKS)) {
    return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
  }

  const habits = await prisma.$transaction(
    PACKS[pack as keyof typeof PACKS].map((h) =>
      prisma.habit.create({
        data: {
          userId: session.user.id,
          title: h.title,
          icon: h.icon,
          color: h.color,
          category: h.category,
          frequency: 'daily',
          targetDays: 7,
          scheduledTime: 'anytime',
        },
      })
    )
  );

  return NextResponse.json({ habits });
}
