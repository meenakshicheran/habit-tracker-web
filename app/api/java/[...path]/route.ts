import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const SPRING_BASE = process.env.SPRING_API_URL ?? 'http://localhost:8080';

type Context = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Context, method: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await ctx.params;
  const downstream = `${SPRING_BASE}/api/${path.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-Email': session.user.email,
  };

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = await req.text();
  }

  const res = await fetch(downstream, init);
  const body = await res.text();

  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export const GET    = (req: NextRequest, ctx: Context) => proxy(req, ctx, 'GET');
export const POST   = (req: NextRequest, ctx: Context) => proxy(req, ctx, 'POST');
export const PUT    = (req: NextRequest, ctx: Context) => proxy(req, ctx, 'PUT');
export const PATCH  = (req: NextRequest, ctx: Context) => proxy(req, ctx, 'PATCH');
export const DELETE = (req: NextRequest, ctx: Context) => proxy(req, ctx, 'DELETE');
