import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ('name' in body && typeof body.name === 'string') data.name = body.name.trim();
  if ('notificationsEnabled' in body && typeof body.notificationsEnabled === 'boolean')
    data.notificationsEnabled = body.notificationsEnabled;
  if ('defaultReminderTime' in body)
    data.reminderTime = body.defaultReminderTime ?? null;
  if ('defaultCategory' in body && typeof body.defaultCategory === 'string')
    data.defaultCategory = body.defaultCategory;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      name: true,
      notificationsEnabled: true,
      reminderTime: true,
      defaultCategory: true,
    },
  });
  return NextResponse.json(updated);
}
