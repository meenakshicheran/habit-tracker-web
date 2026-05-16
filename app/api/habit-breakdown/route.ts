import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { title } = body;
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }

  const prompt = `You are a habit coach. A user wants to build this habit: "${title.trim()}"

Generate exactly 3 versions as JSON. No markdown, no extra text, just valid JSON:

{
  "beginner": { "title": "...", "description": "...", "duration": "..." },
  "intermediate": { "title": "...", "description": "...", "duration": "..." },
  "advanced": { "title": "...", "description": "...", "duration": "..." }
}

Rules:
- title: short, action-oriented, max 5 words
- description: one sentence, what exactly to do, max 12 words
- duration: time commitment like "5 min/day", "20 min/day", "1 hr/day"
- beginner: tiny, low friction, anyone can start today
- intermediate: requires some effort, builds real momentum
- advanced: challenging, for serious commitment
- Be specific to "${title.trim()}", not generic`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[habit-breakdown]', err);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
