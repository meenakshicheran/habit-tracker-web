import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayISO, addDays } from '@/lib/utils';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = todayISO();

  // Return cached insight for today if it exists
  const cached = await prisma.dailyInsight.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });
  if (cached) return NextResponse.json({ content: cached.content, ai: true });

  // Fall back gracefully if API key not configured
  if (!client) {
    return NextResponse.json({ content: null, ai: false });
  }

  // Gather last 7 days of completions for context
  const sevenDaysAgo = addDays(today, -6);
  const [habits, logs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session.user.id, archived: false },
      select: { title: true, category: true },
    }),
    prisma.habitLog.findMany({
      where: {
        userId: session.user.id,
        date: { gte: sevenDaysAgo, lte: today },
        completed: true,
      },
      select: { date: true, habitId: true, habit: { select: { title: true } } },
    }),
  ]);

  if (habits.length === 0) {
    return NextResponse.json({ content: null, ai: false });
  }

  // Build a compact summary for the prompt
  const byDate = new Map<string, string[]>();
  for (const log of logs) {
    const arr = byDate.get(log.date) ?? [];
    arr.push(log.habit.title);
    byDate.set(log.date, arr);
  }

  const lines = [];
  for (let i = 0; i <= 6; i++) {
    const d = addDays(sevenDaysAgo, i);
    const done = byDate.get(d) ?? [];
    lines.push(`${d}: ${done.length}/${habits.length} habits (${done.join(', ') || 'none'})`);
  }

  const habitList = habits.map((h) => `${h.title} (${h.category})`).join(', ');
  const dataStr = lines.join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'You are a habit coach. Given a user\'s habit data, write exactly one short (2 sentences max), specific, encouraging insight about their pattern. Be concrete, not generic. No greeting, no sign-off.',
      messages: [
        {
          role: 'user',
          content: `My habits: ${habitList}\n\nLast 7 days:\n${dataStr}`,
        },
      ],
    });

    const content = (message.content[0] as { type: string; text: string }).text.trim();

    await prisma.dailyInsight.create({
      data: { userId: session.user.id, date: today, content },
    });

    return NextResponse.json({ content, ai: true });
  } catch {
    return NextResponse.json({ content: null, ai: false });
  }
}
