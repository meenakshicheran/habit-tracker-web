'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useWeeklyChallenge, useClaimWeeklyChallenge } from '@/lib/hooks/useHabits';
import { ProgressRing } from '@/components/ui/progress-ring';

export function WeeklyChallengeCard() {
  const { data, isPending } = useWeeklyChallenge();
  const { mutate: claim, isPending: isClaiming } = useClaimWeeklyChallenge();

  if (isPending) {
    return <div className="h-24 bg-surface border border-border rounded-xl animate-pulse mb-6" />;
  }
  if (!data) return null;

  const { challenge, progress } = data;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mb-6 bg-surface border border-border rounded-xl p-4"
      style={progress.claimed ? { borderColor: '#16a34a40' } : {}}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-[22px]"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <span className="emoji" style={{ fontSize: 22, lineHeight: 1 }}>🏆</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight">{challenge.title}</p>
          <p className="text-[11px] text-text-muted leading-tight mt-0.5">{challenge.description}</p>
          {/* XP badge */}
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold mt-1"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}
          >
            <Zap className="w-3 h-3" />
            +{challenge.xpReward} XP
          </div>
        </div>

        {/* Circular progress ring */}
        <div className="flex-shrink-0">
          <ProgressRing
            value={progress.daysCompleted}
            max={challenge.targetDays}
            size={52}
            strokeWidth={4}
            color={progress.claimed ? '#16a34a' : '#6366f1'}
          >
            <span className="text-[10px] font-semibold text-text-primary leading-none">
              {progress.daysCompleted}/{challenge.targetDays}
            </span>
          </ProgressRing>
        </div>
      </div>

      {/* Claim button */}
      {progress.claimed ? (
        <p className="text-xs text-emerald-500 font-medium mt-3">✓ Reward claimed this week</p>
      ) : (
        <button
          onClick={() => claim()}
          disabled={!progress.eligible || isClaiming}
          className="mt-3 w-full py-2 rounded-lg text-xs font-semibold transition-all"
          style={
            progress.eligible
              ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff' }
              : { background: 'var(--surface-raised)', color: 'var(--text-muted)', cursor: 'not-allowed' }
          }
        >
          {isClaiming
            ? 'Claiming…'
            : progress.eligible
            ? `Claim +${challenge.xpReward} XP`
            : `Keep going — ${challenge.targetDays - progress.daysCompleted} day${challenge.targetDays - progress.daysCompleted !== 1 ? 's' : ''} left`}
        </button>
      )}
    </motion.div>
  );
}
