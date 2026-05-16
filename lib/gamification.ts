export const XP_PER_COMPLETION = 10;

export const LEVELS = [
  { level: 1, name: 'Beginner', minXp: 0 },
  { level: 2, name: 'Starter', minXp: 100 },
  { level: 3, name: 'Rising', minXp: 300 },
  { level: 4, name: 'Builder', minXp: 600 },
  { level: 5, name: 'Consistent', minXp: 1000 },
  { level: 6, name: 'Dedicated', minXp: 1500 },
  { level: 7, name: 'Champion', minXp: 2200 },
  { level: 8, name: 'Elite', minXp: 3000 },
  { level: 9, name: 'Legend', minXp: 4000 },
  { level: 10, name: 'Master', minXp: 5500 },
];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (data: { currentStreak: number; longestStreak: number; totalCompletions: number }) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first habit',
    icon: '🌱',
    condition: ({ totalCompletions }) => totalCompletions >= 1,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7-day streak',
    icon: '🔥',
    condition: ({ longestStreak }) => longestStreak >= 7,
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: '30-day streak',
    icon: '💎',
    condition: ({ longestStreak }) => longestStreak >= 30,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: '100-day streak',
    icon: '👑',
    condition: ({ longestStreak }) => longestStreak >= 100,
  },
  {
    id: 'century_completions',
    name: 'Centurion',
    description: '100 total completions',
    icon: '⚡',
    condition: ({ totalCompletions }) => totalCompletions >= 100,
  },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null!;
      break;
    }
  }
  const xpIntoLevel = xp - current.minXp;
  const xpForNextLevel = next ? next.minXp - current.minXp : 1;
  const progress = next ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100;
  return { current, next, progress, xpIntoLevel, xpForNextLevel };
}
