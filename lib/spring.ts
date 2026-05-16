const SPRING_BASE = process.env.SPRING_API_URL ?? 'http://localhost:8080';

export interface SpringHabit {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  frequency?: string | null;
  color?: string | null;
  targetDays?: number | null;
  isActive?: boolean;
  createdAt?: string | null;
  currentStreak?: number;
  longestStreak?: number;
  completedToday?: boolean;
}

export function mapHabit(h: SpringHabit) {
  return {
    id: String(h.id),
    title: h.name,
    description: h.description ?? null,
    icon: '✅',
    color: h.color ?? '#6366f1',
    category: h.category ?? 'health',
    frequency: h.frequency ?? 'DAILY',
    targetDays: h.targetDays ?? 7,
    reminderTime: null,
    scheduledTime: null,
    archived: h.isActive === false,
    createdAt: h.createdAt ?? new Date().toISOString(),
    streak: { current: h.currentStreak ?? 0, longest: h.longestStreak ?? 0 },
    completedToday: h.completedToday ?? false,
  };
}

export async function springFetch(
  path: string,
  email: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${SPRING_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Email': email,
      ...((options.headers ?? {}) as Record<string, string>),
    },
  });
}
