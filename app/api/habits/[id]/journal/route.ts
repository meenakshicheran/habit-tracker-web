import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayISO } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habit = await prisma.habit.findFirst({ where: { id, userId: session.user.id } });
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const entries = await prisma.journalEntry.findMany({
    where: { habitId: id, userId: session.user.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(entries);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habit = await prisma.habit.findFirst({ where: { id, userId: session.user.id } });
  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { content, date } = await req.json().catch(() => ({}));
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  const entryDate = date ?? todayISO();

  const entry = await prisma.journalEntry.upsert({
    where: { habitId_date: { habitId: id, date: entryDate } },
    create: { habitId: id, userId: session.user.id, date: entryDate, content: content.trim() },
    update: { content: content.trim() },
  });

  return NextResponse.json(entry);
}
