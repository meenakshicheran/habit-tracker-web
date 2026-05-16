import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { habitData } = body;
  if (!habitData) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const prompt = `You are an expert habit coach. Analyze this user's weekly habit data and write a short, personal weekly review.

User data:
- Habits: ${habitData.habits}
- This week's completions per day: ${habitData.dailyCompletions}
- Overall completion rate: ${habitData.weeklyRate}%
- Current streak: ${habitData.streak} days
- Best performing day: ${habitData.bestDay}
- Worst performing day: ${habitData.worstDay}
- Total completions this week: ${habitData.totalCompletions}

Write EXACTLY 3 short sentences:
1. What pattern you noticed this week (specific, not generic)
2. Their strongest moment or day
3. One concrete actionable suggestion for next week

Tone: warm, coach-like, direct. No bullet points. No headers. Just 3 flowing sentences. Max 80 words total.`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = completion.choices[0]?.message?.content ?? "Keep showing up — consistency is built one day at a time.";
    return NextResponse.json({ review: text });
  } catch (err) {
    console.error('[weekly-review]', err);
    return NextResponse.json({ review: "Keep showing up — consistency is built one day at a time." });
  }
}
