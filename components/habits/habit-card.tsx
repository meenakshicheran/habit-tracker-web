'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Snowflake } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToggleHabit, useFreezeHabit, useUserStats, type HabitSummaryItem } from '@/lib/hooks/useHabits';
import { addDays, todayISO } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: HabitSummaryItem;
}

export function HabitCard({ habit }: HabitCardProps) {
  const { mutate: toggle, isPending } = useToggleHabit();
  const { mutate: freeze, isPending: isFreezing } = useFreezeHabit();
  const { data: userStats } = useUserStats();
  const [showXp, setShowXp] = useState(false);

  const canFreeze = habit.streak.current === 0 && (userStats?.freezeTokens ?? 0) > 0;
  const yesterday = addDays(todayISO(), -1);

  const isOverdue = useMemo(() => {
    if (habit.completedToday || !habit.reminderTime) return false;
    const [h, m] = habit.reminderTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    return new Date() > target;
  }, [habit.completedToday, habit.reminderTime]);

  function handleCheck() {
    if (isPending) return;
    const wasCompleted = habit.completedToday;
    toggle({ habitId: habit.id });
    if (!wasCompleted) {
      setShowXp(true);
      setTimeout(() => setShowXp(false), 1500);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: habit.completedToday ? 0.5 : 1,
        y: 0,
        x: habit.completedToday ? 4 : 0,
      }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative rounded-2xl p-4"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      {isOverdue && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400" />}

      <div className="flex items-center gap-3">
        {/* 44×44 emoji badge */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--icon-bg)' }}
        >
          <span className="emoji" style={{ fontSize: 22, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {habit.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-[15px] font-medium text-text-primary truncate', habit.completedToday && 'line-through text-text-muted')}>
            {habit.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full text-text-secondary" style={{ background: 'var(--icon-bg)' }}>
              {habit.category}
            </span>
            {habit.streak.current > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] font-medium text-orange-400">
                <Flame className="w-3 h-3" />
                {habit.streak.current}d
              </span>
            )}
          </div>
        </div>

        {canFreeze && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => freeze({ habitId: habit.id, date: yesterday })}
            disabled={isFreezing}
            title={`Use a freeze token (${userStats?.freezeTokens} left)`}
            className="w-9 h-9 rounded-xl border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/10 transition-colors flex-shrink-0"
          >
            <Snowflake className="w-3.5 h-3.5" />
          </motion.button>
        )}

        <AnimatePresence>
          {showXp && (
            <motion.span
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -22 }}
              exit={{ opacity: 0, y: -34 }}
              transition={{ duration: 0.45 }}
              className="absolute right-14 top-2 text-xs font-bold pointer-events-none text-accent"
            >
              +10 XP
            </motion.span>
          )}
        </AnimatePresence>

        {/* Check button — 44px, pop animation on complete */}
        <motion.button
          animate={habit.completedToday ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleCheck}
          disabled={isPending}
          aria-label={habit.completedToday ? 'Undo' : 'Complete'}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={
            habit.completedToday
              ? { background: '#22C55E', border: 'none' }
              : { background: 'transparent', border: '1.5px solid var(--check-border)' }
          }
          onMouseEnter={(e) => {
            if (!habit.completedToday) (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
          }}
          onMouseLeave={(e) => {
            if (!habit.completedToday) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--check-border)';
          }}
        >
          {habit.completedToday && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
        </motion.button>
      </div>
    </motion.div>
  );
}
