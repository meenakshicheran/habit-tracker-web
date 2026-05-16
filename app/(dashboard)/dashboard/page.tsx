'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Flame, Plus, Star, Target, TrendingUp, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { Confetti } from '@/components/ui/confetti';
import { HabitCard } from '@/components/habits/habit-card';
import { HabitModal } from '@/components/habits/habit-modal';
import { DynamicGreeting } from '@/components/dynamic-greeting';
import { useDashboardSummary, useUserStats } from '@/lib/hooks/useHabits';
import { useHabitNotifications } from '@/lib/hooks/useNotifications';
import { getDailyQuote } from '@/lib/quotes';
import { getLevelInfo } from '@/lib/gamification';
import { WeeklyChallengeCard } from '@/components/challenges/weekly-challenge-card';

const quote = getDailyQuote();

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data, isPending } = useDashboardSummary();
  const { data: userStats } = useUserStats();
  const [modalOpen, setModalOpen] = useState(false);

  useHabitNotifications(data?.habits, userStats);

  const stats = data?.stats;
  const habits = data?.habits ?? [];
  const allDone = !isPending && stats != null && stats.totalHabits > 0 && stats.completedToday === stats.totalHabits;

  const userXp = userStats?.xp ?? 0;
  const levelInfo = useMemo(() => getLevelInfo(userXp), [userXp]);

  const completionPct = stats
    ? Math.round((stats.completedToday / Math.max(1, stats.totalHabits)) * 100)
    : 0;

  return (
    <>
      <Confetti fire={allDone} />

      <DynamicGreeting
        userData={{
          name: session?.user?.name ?? 'there',
          completedToday: stats?.completedToday ?? 0,
          totalHabits: stats?.totalHabits ?? 0,
          streak: stats?.averageStreak ?? 0,
          bestStreak: stats?.longestStreak ?? 0,
          weeklyRate: completionPct,
          daysSinceLastMiss: 1,
        }}
      />

      {/* Stat cards — Prompt 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[20px] h-28 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ))
        ) : (
          <>
            <StatCard
              color="#6366f1"
              glowColor="rgba(99,102,241,0.15)"
              icon={CheckCircle2}
              value={`${stats?.completedToday ?? 0}/${stats?.totalHabits ?? 0}`}
              label="Today's Progress"
            />
            <StatCard
              color="#ef4444"
              glowColor="rgba(239,68,68,0.15)"
              icon={Flame}
              value={`${stats?.averageStreak ?? 0}d`}
              label="Current Streak"
            />
            <StatCard
              color="#f59e0b"
              glowColor="rgba(245,158,11,0.15)"
              icon={TrendingUp}
              value={`${stats?.longestStreak ?? 0}d`}
              label="Best Streak"
            />
            <StatCard
              color="#22c55e"
              glowColor="rgba(34,197,94,0.15)"
              icon={Target}
              value={`${completionPct}%`}
              label="Completion Rate"
            />
          </>
        )}
      </div>

      {/* XP bar */}
      <div className="rounded-[20px] mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 24px' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#818CF8' }}>
            <Zap className="w-3.5 h-3.5" />
            Lv {levelInfo.current.level} — {levelInfo.current.name}
          </span>
          <span className="text-[12px] text-text-muted">
            {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
          </span>
        </div>

        <div className="h-px mb-3" style={{ background: 'var(--divider)' }} />

        <div
          className="relative h-2.5 rounded-full overflow-hidden"
          style={{ background: 'var(--icon-bg)', border: '1px solid var(--divider)' }}
        >
          <motion.div
            className="relative h-full rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #6366F1, #818CF8)',
              boxShadow: '0 0 12px 2px rgba(99,102,241,0.6), 0 0 24px 4px rgba(99,102,241,0.3)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {levelInfo.progress > 0 && (
              <div
                className="absolute inset-y-0 w-1/2"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s ease-in-out infinite',
                }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Weekly Challenge */}
      <WeeklyChallengeCard />

      {/* Quote */}
      <p className="text-xs text-text-muted italic mb-8">
        &ldquo;{quote.text}&rdquo; &mdash; {quote.author}
      </p>

      {/* Today's habits — Prompt 3 section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[18px] font-semibold text-text-primary">Today&apos;s Habits</span>
          {allDone && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
              style={{ animation: 'pulse-dot 1.5s ease-in-out infinite' }}
            />
          )}
        </div>
        {allDone && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs text-accent font-medium flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> All done
          </motion.span>
        )}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <span className="text-3xl">🌱</span>
          <p className="text-sm text-text-secondary font-medium mt-1">No habits yet</p>
          <p className="text-xs text-text-muted">Tap + to create your first habit</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* FAB */}
      <motion.button
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-24 right-20 md:bottom-8 md:right-24 w-12 h-12 rounded-full flex items-center justify-center z-30 text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}
        aria-label="Create habit"
      >
        <Plus className="w-5 h-5" />
      </motion.button>

      <HabitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function StatCard({
  color,
  glowColor,
  icon: Icon,
  value,
  label,
}: {
  color: string;
  glowColor: string;
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-[20px] p-6 overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hovered ? 'var(--card-border-hover)' : 'var(--card-border)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow — top-right corner only */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: glowColor,
          filter: 'blur(30px)',
          opacity: hovered ? 0.25 : 0.10,
        }}
      />
      {/* Icon top-right */}
      <Icon className="absolute top-4 right-4 w-5 h-5" style={{ color, opacity: 0.7 }} />
      {/* Value */}
      <p className="relative text-[36px] font-semibold leading-none tabular-nums text-text-primary">
        {value}
      </p>
      {/* Label */}
      <p
        className="relative mt-2.5 text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted"
        style={{ letterSpacing: '0.08em' }}
      >
        {label}
      </p>
    </div>
  );
}
