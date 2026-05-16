import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { mapHabit, springFetch } from '@/lib/spring';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await springFetch('/api/habits', session.user.email!);
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch habits' }, { status: res.status });

  const habits = await res.json();
  return NextResponse.json(habits.map(mapHabit));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const res = await springFetch('/api/habits', session.user.email!, {
    method: 'POST',
    body: JSON.stringify({
      name: body.title,
      description: body.description,
      category: body.category,
      frequency: body.frequency ?? 'DAILY',
      color: body.color,
      targetDays: body.targetDays,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to create habit' }, { status: res.status });
  const habit = await res.json();
  return NextResponse.json(mapHabit(habit), { status: 201 });
}
