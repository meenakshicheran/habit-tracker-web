'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Streak {
  current: number;
  longest: number;
}

export interface HabitSummaryItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  category: string;
  frequency: string;
  targetDays: number;
  scheduledTime: string;
  reminderTime: string | null;
  streak: Streak;
  completedToday: boolean;
}

export interface JournalEntry {
  id: string;
  habitId: string;
  date: string;
  content: string;
  createdAt: string;
}

export interface DashboardSummary {
  habits: HabitSummaryItem[];
  stats: {
    totalHabits: number;
    completedToday: number;
    averageStreak: number;
    longestStreak: number;
  };
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Habit {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  color: string;
  category: string;
  frequency: string;
  targetDays: number;
  reminderTime?: string | null;
  archived: boolean;
  createdAt: string;
  streak?: Streak | null;
}

export interface HabitStats {
  habit: Habit;
  streak: Streak;
  completionDates: string[];
  weeklyStats: { week: number; count: number; rate: number }[];
  totalCompletions: number;
  completionRate: number;
  last84Days: { date: string; completed: boolean }[];
  last7Days: { date: string; completed: boolean }[];
  journals: { date: string; content: string }[];
}

export interface HabitInput {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  frequency?: string;
  targetDays?: number;
  reminderTime?: string | null;
  scheduledTime?: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export interface UserStats {
  xp: number;
  level: number;
  freezeTokens: number;
  onboardingDone?: boolean;
  reminderTime?: string | null;
  notificationsEnabled: boolean;
  defaultCategory: string;
  name?: string | null;
}

const KEYS = {
  habits: ['habits'] as const,
  summary: ['dashboard', 'summary'] as const,
  heatmap: ['dashboard', 'heatmap'] as const,
  habitStats: (id: string) => ['habits', id, 'stats'] as const,
  userStats: ['user', 'stats'] as const,
  weeklyChallenge: ['challenges', 'weekly'] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Request failed');
  }
  return res.json();
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: KEYS.habits,
    queryFn: () => fetchJSON('/api/habits'),
  });
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: KEYS.summary,
    queryFn: () => fetchJSON('/api/dashboard/summary'),
  });
}

export function useHeatmapData() {
  return useQuery<{ days: HeatmapDay[] }>({
    queryKey: KEYS.heatmap,
    queryFn: () => fetchJSON('/api/dashboard/heatmap'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHabitStats(id: string) {
  return useQuery<HabitStats>({
    queryKey: KEYS.habitStats(id),
    queryFn: () => fetchJSON(`/api/habits/${id}/stats`),
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: KEYS.userStats,
    queryFn: () => fetchJSON('/api/user/me'),
    staleTime: 0,
  });
}

export interface WeeklyChallengeData {
  challenge: {
    id: string;
    title: string;
    description: string;
    targetDays: number;
    xpReward: number;
    weekStart: string;
  };
  progress: {
    daysCompleted: number;
    claimed: boolean;
    eligible: boolean;
  };
}

export function useWeeklyChallenge() {
  return useQuery<WeeklyChallengeData>({
    queryKey: KEYS.weeklyChallenge,
    queryFn: () => fetchJSON('/api/challenges/weekly'),
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: HabitInput) =>
      fetchJSON<Habit>('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast.success(`${data.icon} ${data.title} added!`);
      qc.invalidateQueries({ queryKey: KEYS.habits });
      qc.invalidateQueries({ queryKey: KEYS.summary });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: HabitInput & { id: string }) =>
      fetchJSON<Habit>(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.habits });
      qc.invalidateQueries({ queryKey: KEYS.summary });
    },
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON(`/api/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.habits });
      qc.invalidateQueries({ queryKey: KEYS.summary });
    },
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJSON<Habit>(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.habits });
      qc.invalidateQueries({ queryKey: KEYS.summary });
    },
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date?: string }) =>
      fetchJSON<{ completed: boolean; date: string; streak: Streak; xp: number; level: number; freezeTokens: number }>(
        `/api/habits/${habitId}/check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(date ? { date } : {}),
        }
      ),
    onMutate: async ({ habitId }) => {
      await qc.cancelQueries({ queryKey: KEYS.summary });
      const previous = qc.getQueryData<DashboardSummary>(KEYS.summary);
      if (previous) {
        const habit = previous.habits.find((h) => h.id === habitId);
        const wasCompleted = habit?.completedToday ?? false;
        qc.setQueryData<DashboardSummary>(KEYS.summary, {
          ...previous,
          habits: previous.habits.map((h) =>
            h.id === habitId ? { ...h, completedToday: !h.completedToday } : h
          ),
          stats: {
            ...previous.stats,
            completedToday: previous.stats.completedToday + (wasCompleted ? -1 : 1),
          },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(KEYS.summary, ctx.previous);
    },
    onSuccess: (data) => {
      if (data.completed) {
        const MILESTONES = [7, 14, 21, 30, 60, 100];
        if (MILESTONES.includes(data.streak?.current ?? 0)) {
          toast.success(`${data.streak.current} day streak! 🔥`);
        } else {
          toast.success('+10 XP');
        }
      }
      qc.setQueryData<UserStats>(KEYS.userStats, (prev) =>
        prev ? { ...prev, xp: data.xp, level: data.level, freezeTokens: data.freezeTokens } : prev
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.summary });
      qc.invalidateQueries({ queryKey: KEYS.habits });
      qc.invalidateQueries({ queryKey: KEYS.heatmap });
      qc.invalidateQueries({ queryKey: KEYS.weeklyChallenge });
    },
  });
}

export function useClaimWeeklyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJSON<{ xp: number; level: number; freezeTokens: number }>('/api/challenges/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    onSuccess: (data) => {
      qc.setQueryData<UserStats>(KEYS.userStats, (prev) =>
        prev ? { ...prev, xp: data.xp, level: data.level, freezeTokens: data.freezeTokens } : prev
      );
      qc.invalidateQueries({ queryKey: KEYS.weeklyChallenge });
    },
  });
}

export function useFreezeHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      fetchJSON<{ freezeTokens: number }>(`/api/habits/${habitId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      }),
    onSuccess: (data) => {
      toast.success('Streak saved! ❄️');
      qc.setQueryData<UserStats>(KEYS.userStats, (prev) =>
        prev ? { ...prev, freezeTokens: data.freezeTokens } : prev
      );
      qc.invalidateQueries({ queryKey: KEYS.userStats });
      qc.invalidateQueries({ queryKey: KEYS.summary });
      qc.invalidateQueries({ queryKey: KEYS.habits });
    },
  });
}

export function useJournalEntries(habitId: string) {
  return useQuery<JournalEntry[]>({
    queryKey: ['journal', habitId],
    queryFn: () => fetchJSON(`/api/habits/${habitId}/journal`),
    enabled: !!habitId,
  });
}

export function useSaveJournal(habitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, date }: { content: string; date?: string }) =>
      fetchJSON<JournalEntry>(`/api/habits/${habitId}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, date }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal', habitId] }),
  });
}

export function useAiInsight() {
  return useQuery<{ content: string | null; ai: boolean }>({
    queryKey: ['ai', 'insight'],
    queryFn: () => fetchJSON('/api/ai/insight'),
    staleTime: 60 * 60 * 1000, // 1 hour — insight is per-day
    retry: false,
  });
}

export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { onboardingDone?: boolean; reminderTime?: string }) =>
      fetchJSON('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.userStats }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      name: string;
      notificationsEnabled: boolean;
      defaultReminderTime: string | null;
      defaultCategory: string;
    }>) =>
      fetchJSON('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.userStats }),
  });
}
