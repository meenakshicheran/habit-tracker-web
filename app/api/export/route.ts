import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  const [user, habits] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true },
    }),
    prisma.habit.findMany({
      where: { userId: session.user.id },
      include: {
        logs: { orderBy: { date: 'asc' } },
        streak: true,
        journals: { orderBy: { date: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  if (format === 'csv') {
    const rows: string[] = ['habit_id,habit_title,date,completed'];
    for (const habit of habits) {
      for (const log of habit.logs) {
        rows.push(`"${habit.id}","${habit.title.replace(/"/g, '""')}","${log.date}",${log.completed}`);
      }
    }
    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="habitflow-export.csv"',
      },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { xp: user?.xp ?? 0, level: user?.level ?? 1 },
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      icon: h.icon,
      color: h.color,
      category: h.category,
      frequency: h.frequency,
      targetDays: h.targetDays,
      reminderTime: h.reminderTime,
      scheduledTime: h.scheduledTime,
      archived: h.archived,
      createdAt: h.createdAt,
      streak: h.streak ? { current: h.streak.current, longest: h.streak.longest } : null,
      logs: h.logs.map((l) => ({ date: l.date, completed: l.completed, note: l.note })),
      journals: h.journals.map((j) => ({ date: j.date, content: j.content })),
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="habitflow-export.json"',
    },
  });
}
