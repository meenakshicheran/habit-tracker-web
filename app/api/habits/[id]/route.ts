import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { mapHabit, springFetch } from '@/lib/spring';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // archived:true maps to Spring Boot's soft-delete (sets isActive=false)
  if (body.archived === true) {
    const res = await springFetch(`/api/habits/${id}`, session.user.email!, { method: 'DELETE' });
    if (!res.ok) return NextResponse.json({ error: 'Failed to archive habit' }, { status: res.status });
    return NextResponse.json({ id, archived: true });
  }

  const res = await springFetch(`/api/habits/${id}`, session.user.email!, {
    method: 'PUT',
    body: JSON.stringify({
      name: body.title ?? body.name,
      description: body.description,
      category: body.category,
      frequency: body.frequency ?? 'DAILY',
      color: body.color,
      targetDays: body.targetDays,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to update habit' }, { status: res.status });
  const habit = await res.json();
  return NextResponse.json(mapHabit(habit));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const res = await springFetch(`/api/habits/${id}`, session.user.email!, { method: 'DELETE' });
  if (!res.ok) return NextResponse.json({ error: 'Failed to delete habit' }, { status: res.status });
  return NextResponse.json({ success: true });
}
