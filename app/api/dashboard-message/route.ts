import Groq from 'groq-sdk';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ message: "Keep showing up. That's all it takes." });

  const body = await req.json().catch(() => ({}));
  const { userData } = body;
  if (!userData) return NextResponse.json({ message: "Keep showing up. That's all it takes." });

  const prompt = `You are an AI inside a habit tracking app.
Generate ONE short, punchy, emotionally intelligent dashboard message for this user right now.

User data:
- Name: ${userData.name}
- Time of day: ${userData.timeOfDay}
- Habits completed today: ${userData.completedToday}/${userData.totalHabits}
- Current streak: ${userData.streak} days
- Best streak ever: ${userData.bestStreak} days
- Completion rate this week: ${userData.weeklyRate}%
- Days since last miss: ${userData.daysSinceLastMiss}

Rules:
- Max 12 words
- No generic motivational quotes
- Be specific to their data
- Match the time of day (morning=energetic, evening=reflective)
- If streak is at risk (0 habits done and it's evening): warn them
- If all habits done: celebrate loudly
- If on a long streak (7+ days): acknowledge the achievement
- If they just recovered from a miss: encourage the comeback
- Return ONLY the message text, nothing else, no quotes`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 30,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }],
    });
    const message = completion.choices[0]?.message?.content?.trim() ?? "Keep showing up. That's all it takes.";
    return NextResponse.json({ message });
  } catch (err) {
    console.error('[dashboard-message]', err);
    return NextResponse.json({ message: "Keep showing up. That's all it takes." });
  }
}
