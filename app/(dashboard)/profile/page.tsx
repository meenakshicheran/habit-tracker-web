'use client';

import { motion } from 'framer-motion';
import { Bell, Flame, Star, Trophy, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useHabits, useUserStats } from '@/lib/hooks/useHabits';
import { BADGES, getLevelInfo } from '@/lib/gamification';

function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-8 w-24 bg-surface-raised rounded mb-6" />
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-surface-raised flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-surface-raised rounded" />
          <div className="h-3 w-48 bg-surface-raised rounded" />
          <div className="h-3 w-24 bg-surface-raised rounded" />
        </div>
        <div className="w-14 h-14 rounded-full bg-surface-raised flex-shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 bg-surface-raised" />
        ))}
      </div>
      <div className="bg-surface border border-border rounded-xl p-4 mb-4 h-24 bg-surface-raised" />
      <div className="bg-surface border border-border rounded-xl p-4 h-32 bg-surface-raised" />
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: habits } = useHabits();
  const { data: userStats } = useUserStats();

  const name = session?.user?.name ?? 'User';
  const email = session?.user?.email ?? '';
  const initials = name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  const userXp = userStats?.xp ?? 0;
  const freezeTokens = userStats?.freezeTokens ?? 3;
  const levelInfo = useMemo(() => getLevelInfo(userXp), [userXp]);

  const isLoading = !userStats || !habits;

  const longestStreak = useMemo(
    () => habits?.reduce((acc, h) => Math.max(acc, h.streak?.longest ?? 0), 0) ?? 0,
    [habits]
  );
  const totalHabits = habits?.length ?? 0;

  const earnedBadges = BADGES.filter((b) =>
    b.condition({ currentStreak: 0, longestStreak, totalCompletions: userXp / 10 })
  );
  const lockedBadges = BADGES.filter((b) =>
    !b.condition({ currentStreak: 0, longestStreak, totalCompletions: userXp / 10 })
  );

  const xpCount = useCounter(userXp);
  const streakCount = useCounter(longestStreak);
  const habitCount = useCounter(totalHabits);

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Profile</h1>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 mb-4 flex items-center gap-5"
      >
        {/* 72px gradient ring avatar */}
        <div className="flex-shrink-0" style={{ padding: 3, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-text-primary"
            style={{ background: 'var(--avatar-bg)' }}
          >
            {initials}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-text-primary truncate">{name}</p>
          <p className="text-sm text-text-muted truncate">{email}</p>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--accent)' }}>
            Lv {levelInfo.current.level} — {levelInfo.current.name}
          </p>
          <button
            onClick={() => {
              if (!('Notification' in window)) return;
              if (Notification.permission !== 'granted') { Notification.requestPermission(); return; }
              new Notification('HabitFlow', { body: 'Test notification — working! 🎉', icon: '/icon.png' });
            }}
            className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <Bell className="w-3 h-3" />
            Test notification
          </button>
        </div>
        <div className="text-center flex-shrink-0">
          <p className="text-2xl font-bold text-text-primary">{levelInfo.progress}%</p>
          <p className="text-[10px] text-text-muted mt-0.5">to next level</p>
        </div>
      </motion.div>

      {/* Stats row — animated counters */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: <Zap className="w-4 h-4 text-accent" />, label: 'Total XP', value: xpCount },
          { icon: <Flame className="w-4 h-4 text-orange-400" />, label: 'Best Streak', value: `${streakCount}d` },
          { icon: <Star className="w-4 h-4 text-yellow-400" />, label: 'Habits', value: habitCount },
        ].map(({ icon, label, value }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-xl font-bold text-text-primary tabular-nums">{value}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Freeze token coins */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">❄️</span>
          <span className="text-sm font-semibold text-text-primary">Streak Freeze Tokens</span>
          <span className="text-xs text-text-muted ml-auto">{freezeTokens}/3 remaining</span>
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
              style={
                i < freezeTokens
                  ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }
                  : { background: 'var(--card-bg)', border: '1px solid var(--divider)', opacity: 0.4 }
              }
            >
              <span className="text-xl">❄️</span>
              <span className="text-[10px] font-medium" style={{ color: i < freezeTokens ? '#60a5fa' : 'var(--text-muted)' }}>
                {i < freezeTokens ? 'Ready' : 'Used'}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">Use a token to save your streak when you miss a day.</p>
      </motion.div>

      {/* Badges — 4-col grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-text-primary">Badges</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {earnedBadges.map((badge) => (
            <div key={badge.id} className="glass rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center">
              <span className="text-3xl">{badge.icon}</span>
              <span className="text-[10px] text-text-primary font-medium leading-tight">{badge.name}</span>
            </div>
          ))}
          {lockedBadges.map((badge) => (
            <div key={badge.id} className="relative glass rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center overflow-hidden">
              <span className="text-3xl" style={{ opacity: 0.25 }}>{badge.icon}</span>
              <span className="text-[10px] text-text-muted leading-tight">{badge.name}</span>
              {/* Lock overlay */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
                <span className="text-sm">🔒</span>
              </div>
              {/* Shimmer */}
              <div className="absolute inset-0 -translate-x-full" style={{ animation: 'shimmer 2.5s ease-in-out infinite', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
