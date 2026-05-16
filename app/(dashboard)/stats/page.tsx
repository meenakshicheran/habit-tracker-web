'use client';

import Link from 'next/link';
import { Lightbulb, Trophy } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heatmap } from '@/components/analytics/heatmap';
import { WeeklyChart } from '@/components/analytics/weekly-chart';
import { WeeklyReviewCard } from '@/components/weekly-review-card';
import { useHabitStats, useHeatmapData, useHabits } from '@/lib/hooks/useHabits';
import { generateSummaryInsights } from '@/lib/ai-insights';
import { cn } from '@/lib/utils';

const INSIGHT_BORDER: Record<string, string> = {
  positive: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  suggestion: 'border-l-blue-500',
  neutral: 'border-l-border',
};

function HabitRankRow({ id, rank }: { id: string; rank: number }) {
  const { data } = useHabitStats(id);
  if (!data) return <div className="h-10 bg-surface-raised rounded-lg animate-pulse" />;

  const pct = data.totalCompletions > 0
    ? Math.round((data.totalCompletions / 365) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 text-xs font-bold text-text-muted text-right">{rank}</span>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ backgroundColor: data.habit.color + '20', color: data.habit.color }}
      >
        {data.habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{data.habit.title}</p>
        <div className="mt-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 text-orange-500 text-xs font-medium flex-shrink-0">
        <span>🔥</span>
        <span>{data.streak.current}d</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { data: heatmapData, isPending: heatmapLoading } = useHeatmapData();
  const { data: habits, isPending: habitsLoading } = useHabits();

  const sortedHabits = useMemo(() => {
    if (!habits) return [];
    return [...habits]
      .filter((h) => !h.archived)
      .sort((a, b) => (b.streak?.current ?? 0) - (a.streak?.current ?? 0))
      .slice(0, 6);
  }, [habits]);

  const insights = useMemo(() => {
    if (!habits) return [];
    const summaryHabits = habits.filter((h) => !h.archived).map((h) => ({
      title: h.title,
      streak: h.streak ?? { current: 0, longest: 0 },
      completedToday: false,
    }));
    return generateSummaryInsights(summaryHabits, 0);
  }, [habits]);

  // Aggregate weekly stats from heatmap data
  const weeklyStats = useMemo(() => {
    if (!heatmapData?.days) return [];
    const days = heatmapData.days;
    const today = new Date();

    return Array.from({ length: 8 }, (_, i) => {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);

      const wsISO = weekStart.toISOString().slice(0, 10);
      const weISO = weekEnd.toISOString().slice(0, 10);

      const count = days.filter((d) => d.date >= wsISO && d.date <= weISO && d.count > 0).length;
      const rate = Math.round((count / 7) * 100);
      return { week: 8 - i, count, rate };
    }).reverse();
  }, [heatmapData]);

  const hasHabits = !habitsLoading && (habits?.filter((h) => !h.archived).length ?? 0) > 0;

  const thisWeekStats = useMemo(() => {
    if (!heatmapData?.days || !habits) return null;
    const activeHabits = habits.filter((h) => !h.archived);
    const today = new Date();
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      const found = heatmapData.days.find((day) => day.date === iso);
      return { name: DAY_NAMES[d.getDay()], count: found?.count ?? 0 };
    });

    const totalCompletions = weekDays.reduce((s, d) => s + d.count, 0);
    const totalPossible = activeHabits.length * 7;
    const weeklyRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;
    const sorted = [...weekDays].sort((a, b) => b.count - a.count);
    const streak = Math.max(0, ...activeHabits.map((h) => h.streak?.current ?? 0));

    return {
      habits: activeHabits.map((h) => h.title).join(', ') || 'No habits',
      dailyCompletions: weekDays.map((d) => `${d.name}:${d.count}`).join(', '),
      weeklyRate,
      streak,
      bestDay: sorted[0]?.name ?? 'N/A',
      worstDay: sorted[sorted.length - 1]?.name ?? 'N/A',
      totalCompletions,
    };
  }, [heatmapData, habits]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-muted text-sm mt-1">Your habit trends over the past year</p>
      </div>

      {!habitsLoading && !hasHabits && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <span className="text-6xl">📊</span>
          <p className="text-lg font-semibold text-text-primary">No data yet</p>
          <p className="text-sm text-text-muted max-w-xs">
            Add your first habit and start tracking to see your trends here.
          </p>
          <Link
            href="/habits"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            Add your first habit
          </Link>
        </div>
      )}

      {(habitsLoading || hasHabits) && <div className="flex flex-col gap-6">
        {/* AI Weekly Review */}
        {thisWeekStats && <WeeklyReviewCard habitData={thisWeekStats} />}

        {/* Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Year in Review</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? (
              <div className="h-24 bg-surface-raised rounded-lg animate-pulse" />
            ) : heatmapData?.days ? (
              <Heatmap days={heatmapData.days} />
            ) : null}
          </CardContent>
        </Card>

        {/* Weekly chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyStats.length > 0 ? (
              <WeeklyChart data={weeklyStats} />
            ) : (
              <div className="h-40 bg-surface-raised rounded-lg animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Ranking + Insights side by side on md */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Habit rankings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <CardTitle>Top Habits</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {habitsLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-surface-raised rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sortedHabits.length === 0 ? (
                <p className="text-text-muted text-sm">No habits yet</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {sortedHabits.map((h, i) => (
                    <HabitRankRow key={h.id} id={h.id} rank={i + 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <CardTitle>Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-text-muted text-sm">
                  Complete more habits to unlock personalized insights.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-start gap-3 border-l-2 pl-3 py-1',
                        INSIGHT_BORDER[insight.type]
                      )}
                    >
                      <span className="text-base leading-none mt-0.5">{insight.icon}</span>
                      <p className="text-sm text-text-secondary">{insight.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>}
    </>
  );
}
