import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validations';

const SPRING_BASE = process.env.SPRING_API_URL ?? 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, email: true, name: true },
    });

    // Sync user to Spring Boot so X-User-Email header auth works
    await fetch(`${SPRING_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    }).catch(() => {
      // Non-critical — don't fail registration if Spring Boot is unavailable
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
