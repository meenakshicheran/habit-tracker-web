'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface HabitData {
  habits: string;
  dailyCompletions: string;
  weeklyRate: number;
  streak: number;
  bestDay: string;
  worstDay: string;
  totalCompletions: number;
}

export function WeeklyReviewCard({ habitData }: { habitData: HabitData }) {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cacheKey = 'weekly-review-' + new Date().toDateString();
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setReview(cached);
      setLoading(false);
      return;
    }

    fetch('/api/weekly-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitData }),
    })
      .then((r) => r.json())
      .then((data) => {
        const text = data.review ?? '';
        setReview(text);
        if (text) sessionStorage.setItem(cacheKey, text);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Indigo glow */}
      <div
        style={{
          position: 'absolute', top: -30, left: -30,
          width: 140, height: 140,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles style={{ width: 15, height: 15, color: '#818CF8' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Your week in words
          </span>
        </div>
        <span
          style={{
            fontSize: 11, color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 999, padding: '3px 10px',
          }}
        >
          AI generated
        </span>
      </div>

      {/* Loading dots */}
      {loading && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 0' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block', width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(99,102,241,0.6)',
                animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Review text */}
      {!loading && !error && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
          {review}
        </p>
      )}

      {/* Error */}
      {!loading && error && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Could not load your review. Try refreshing.
        </p>
      )}

      {/* Footer stats */}
      {!loading && !error && (
        <div
          style={{
            display: 'flex', gap: 20, marginTop: 18,
            paddingTop: 16, borderTop: '1px solid var(--divider)',
          }}
        >
          {[
            { label: 'Best day', value: habitData.bestDay },
            { label: 'Completion', value: `${habitData.weeklyRate}%` },
            { label: 'Streak', value: `${habitData.streak}d` },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
