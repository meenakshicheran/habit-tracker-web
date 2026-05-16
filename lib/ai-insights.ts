// Pure client-side habit pattern analysis — no external deps

export interface Insight {
  type: 'positive' | 'warning' | 'suggestion' | 'neutral';
  icon: string;
  text: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayOfWeekCounts(dates: string[], lookbackDays = 90): Map<number, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);
  const counts = new Map<number, number>();
  for (const iso of dates) {
    const d = new Date(iso);
    if (d >= cutoff) {
      const dow = d.getDay();
      counts.set(dow, (counts.get(dow) ?? 0) + 1);
    }
  }
  return counts;
}

export function analyzeDayOfWeek(dates: string[]): Insight[] {
  if (dates.length < 7) return [];
  const counts = dayOfWeekCounts(dates);
  if (counts.size === 0) return [];

  const entries = Array.from(counts.entries());
  entries.sort((a, b) => b[1] - a[1]);
  const [bestDay, bestCount] = entries[0];
  const [worstDay, worstCount] = entries[entries.length - 1];
  const mean = entries.reduce((s, [, c]) => s + c, 0) / entries.length;

  const insights: Insight[] = [];

  if (bestCount >= mean * 1.4) {
    insights.push({
      type: 'positive',
      icon: '📅',
      text: `You're most consistent on ${DAY_NAMES[bestDay]}s — that's your power day!`,
    });
  }

  if (worstCount === 0 && entries.length >= 4) {
    insights.push({
      type: 'neutral',
      icon: '📉',
      text: `You've never completed habits on ${DAY_NAMES[worstDay]}s — consider making it a rest day.`,
    });
  } else if (worstCount < mean * 0.4 && entries.length >= 4) {
    insights.push({
      type: 'suggestion',
      icon: '💡',
      text: `${DAY_NAMES[worstDay]}s are your weakest day. Try setting a reminder for that day.`,
    });
  }

  return insights;
}

export function analyzeRecentRate(dates: string[]): Insight | null {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const recent = dates.filter((iso) => new Date(iso) >= sevenDaysAgo).length;

  if (recent >= 6) {
    return { type: 'positive', icon: '🔥', text: "You're on fire! 6+ completions this week." };
  }
  if (recent >= 4) {
    return { type: 'positive', icon: '⭐', text: `Strong week — ${recent} completions in the last 7 days.` };
  }
  if (recent <= 1 && dates.length >= 7) {
    return { type: 'warning', icon: '⚠️', text: 'Only 1 completion this week — try to check in more often.' };
  }
  return null;
}

export function analyzeConsistency(dates: string[], days = 30): Insight | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const inWindow = dates.filter((iso) => new Date(iso) >= cutoff).length;
  const pct = Math.round((inWindow / days) * 100);

  if (pct >= 80) {
    return { type: 'positive', icon: '🏆', text: `${pct}% completion rate over 30 days — excellent consistency!` };
  }
  if (pct >= 50) {
    return { type: 'neutral', icon: '📊', text: `${pct}% completion rate this month. You're building momentum.` };
  }
  if (pct < 30 && dates.length >= 5) {
    return { type: 'suggestion', icon: '🎯', text: `${pct}% this month. Try pairing your habit with an existing routine.` };
  }
  return null;
}

export function analyzeHabitPatterns(dates: string[], habitTitle?: string): Insight[] {
  const prefix = habitTitle ? `"${habitTitle}" — ` : '';
  const insights: Insight[] = [];

  const dayInsights = analyzeDayOfWeek(dates);
  insights.push(...dayInsights.map((i) => ({ ...i, text: prefix + i.text })));

  const recentInsight = analyzeRecentRate(dates);
  if (recentInsight) insights.push({ ...recentInsight, text: prefix + recentInsight.text });

  const consistencyInsight = analyzeConsistency(dates);
  if (consistencyInsight) insights.push({ ...consistencyInsight, text: prefix + consistencyInsight.text });

  return insights;
}

export interface HabitSummaryForInsights {
  title: string;
  streak: { current: number; longest: number };
  completedToday: boolean;
}

export function generateSummaryInsights(
  habits: HabitSummaryForInsights[],
  completedToday: number
): Insight[] {
  if (habits.length === 0) return [];

  const insights: Insight[] = [];
  const total = habits.length;
  const completionRate = Math.round((completedToday / total) * 100);

  // Overall completion insight
  if (completedToday === total && total > 0) {
    insights.push({ type: 'positive', icon: '🎉', text: `Perfect day! All ${total} habits completed.` });
  } else if (completionRate >= 75) {
    insights.push({ type: 'positive', icon: '✨', text: `Great work — ${completedToday}/${total} habits done today.` });
  } else if (completedToday === 0 && total > 0) {
    insights.push({ type: 'warning', icon: '⏰', text: "You haven't checked in yet today — there's still time!" });
  }

  // Best streak habit
  const best = habits.reduce((prev, cur) =>
    cur.streak.current > prev.streak.current ? cur : prev
  );
  if (best.streak.current >= 7) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      text: `"${best.title}" is on a ${best.streak.current}-day streak — don't break it!`,
    });
  }

  // Habit count insight
  if (total === 1) {
    insights.push({ type: 'suggestion', icon: '➕', text: 'Try adding another habit to build a well-rounded routine.' });
  } else if (total >= 8) {
    insights.push({
      type: 'suggestion',
      icon: '🎯',
      text: 'You have many habits. Focus on the most important ones for better consistency.',
    });
  }

  return insights;
}
