import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ImportLog { date: string; completed: boolean; note?: string | null }
interface ImportJournal { date: string; content: string }
interface ImportHabit {
  id: string;
  title: string;
  description?: string | null;
  icon?: string;
  color?: string;
  category?: string;
  frequency?: string;
  targetDays?: number;
  reminderTime?: string | null;
  scheduledTime?: string;
  archived?: boolean;
  logs?: ImportLog[];
  journals?: ImportJournal[];
}
interface ImportPayload { habits?: ImportHabit[] }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const preview = searchParams.get('preview') === 'true';

  const body: ImportPayload = await req.json().catch(() => ({}));
  const habits = body.habits ?? [];

  const habitsCount = habits.length;
  const logsCount = habits.reduce((s, h) => s + (h.logs?.length ?? 0), 0);
  const journalsCount = habits.reduce((s, h) => s + (h.journals?.length ?? 0), 0);

  if (preview) {
    return NextResponse.json({ habitsCount, logsCount, journalsCount });
  }

  let importedHabits = 0;
  let importedLogs = 0;
  let importedJournals = 0;

  for (const habit of habits) {
    const created = await prisma.habit.upsert({
      where: { id: habit.id },
      update: {},
      create: {
        id: habit.id,
        userId: session.user.id,
        title: habit.title,
        description: habit.description,
        icon: habit.icon ?? '✅',
        color: habit.color ?? '#000000',
        category: habit.category ?? 'General',
        frequency: habit.frequency ?? 'daily',
        targetDays: habit.targetDays ?? 7,
        reminderTime: habit.reminderTime,
        scheduledTime: habit.scheduledTime ?? 'anytime',
        archived: habit.archived ?? false,
      },
    });

    if (created.userId !== session.user.id) {
      await prisma.habit.update({
        where: { id: habit.id },
        data: { userId: session.user.id },
      });
    }
    importedHabits++;

    if (habit.logs?.length) {
      for (const l of habit.logs) {
        try {
          await prisma.habitLog.create({
            data: { habitId: habit.id, userId: session.user.id, date: l.date, completed: l.completed, note: l.note },
          });
          importedLogs++;
        } catch {
          // duplicate — skip
        }
      }
    }

    if (habit.journals?.length) {
      for (const j of habit.journals) {
        try {
          await prisma.journalEntry.create({
            data: { habitId: habit.id, userId: session.user.id, date: j.date, content: j.content },
          });
          importedJournals++;
        } catch {
          // duplicate — skip
        }
      }
    }
  }

  return NextResponse.json({ imported: { habits: importedHabits, logs: importedLogs, journals: importedJournals } });
}
