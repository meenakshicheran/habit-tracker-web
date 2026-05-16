import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function thisMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const rawMessages: Array<{ role: string; content: string }> = Array.isArray(body.messages)
    ? body.messages.slice(-6)
    : [];

  const messages = rawMessages.filter(
    (m): m is { role: 'user' | 'assistant'; content: string } =>
      (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  );

  if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
  }

  // ── Fetch habit context from DB ──────────────────────────────────────────
  const monday = thisMonday();

  const [habits, weekLogs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: session.user.id, archived: false },
      include: { streak: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.habitLog.findMany({
      where: { userId: session.user.id, date: { gte: monday }, completed: true },
      select: { habitId: true },
    }),
  ]);

  const today = new Date();
  const mondayMs = new Date(monday + 'T00:00:00').getTime();
  const daysSinceMonday = Math.max(1, Math.floor((today.getTime() - mondayMs) / 86_400_000) + 1);
  const totalPossible = habits.length * daysSinceMonday;
  const weeklyCompletion =
    totalPossible > 0 ? Math.round((weekLogs.length / totalPossible) * 100) : 0;

  const habitsList =
    habits.length > 0
      ? habits.map((h) => `"${h.title}" (streak: ${h.streak?.current ?? 0}d)`).join(', ')
      : 'No habits yet';

  const streakData =
    habits.length > 0
      ? habits.map((h) => `${h.title}: ${h.streak?.current ?? 0}d`).join(', ')
      : 'none';

  const bestStreak = Math.max(0, ...habits.map((h) => h.streak?.longest ?? 0));

  const threshold = Math.max(1, Math.floor(daysSinceMonday * 0.5));
  const struggling = habits.filter(
    (h) => [...weekLogs].filter((l) => l.habitId === h.id).length < threshold,
  );
  const missedDaysPattern =
    struggling.length > 0
      ? `Struggling this week: ${struggling.slice(0, 3).map((h) => h.title).join(', ')}`
      : 'Consistent performance this week';

  const systemPrompt = `You are an expert AI habit coach inside HabitFlow app. You are warm, encouraging, and direct. You have access to the user's habit data:
- Habits: ${habitsList}
- Current streaks: ${streakData}
- Completion rate this week: ${weeklyCompletion}%
- Best streak ever: ${bestStreak} days
- Missed days pattern: ${missedDaysPattern}

Keep responses concise (2-4 sentences max). Use encouraging language. Give specific, actionable advice based on the user's actual data. Never be generic. End responses with a motivating one-liner.`;

  // ── Stream from Groq ─────────────────────────────────────────────────────
  const groq = new Groq({ apiKey });
  const encoder = new TextEncoder();

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  (async () => {
    try {
      const stream = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) await writer.write(encoder.encode(text));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ai-coach]', msg);
      try {
        await writer.write(encoder.encode("I'm having trouble connecting right now. Please try again in a moment."));
      } catch {}
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}
