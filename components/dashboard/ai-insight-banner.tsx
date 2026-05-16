'use client';

import { Sparkles } from 'lucide-react';
import { useAiInsight } from '@/lib/hooks/useHabits';
import { getDailyQuote } from '@/lib/quotes';

const fallback = getDailyQuote();

export function AiInsightBanner() {
  const { data, isPending } = useAiInsight();

  if (isPending) {
    return (
      <div
        className="mb-6 px-4 py-3 rounded-xl bg-surface border border-border animate-pulse h-14"
        style={{ borderLeft: '3px solid var(--accent)' }}
      />
    );
  }

  const isAi = data?.ai && data.content;
  const text = isAi ? data!.content! : `"${fallback.text}"`;
  const attribution = isAi ? null : `— ${fallback.author}`;

  return (
    <div
      className="mb-6 px-4 py-3 rounded-xl bg-surface border border-border text-sm"
      style={{ borderLeft: '3px solid var(--accent)' }}
    >
      <div className="flex items-start gap-2">
        {isAi && (
          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        )}
        <p className={isAi ? 'text-text-primary' : 'text-text-primary italic'}>{text}</p>
      </div>
      {isAi ? (
        <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--accent)' }}>✦ AI insight</p>
      ) : (
        <p className="text-text-muted mt-1 text-xs">{attribution}</p>
      )}
    </div>
  );
}
