'use client';

import { useEffect, useState } from 'react';

interface UserData {
  name: string;
  completedToday: number;
  totalHabits: number;
  streak: number;
  bestStreak: number;
  weeklyRate: number;
  daysSinceLastMiss: number;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

function getTimeEmoji(time: string) {
  if (time === 'morning') return '🌅';
  if (time === 'afternoon') return '☀️';
  return '🌙';
}

function getStatusBadge(completed: number, total: number, streak: number) {
  if (total === 0) return null;
  const rate = completed / total;
  if (rate === 1) return { text: 'All done today ✓', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' };
  if (rate === 0 && new Date().getHours() >= 18) return { text: 'Streak at risk', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' };
  if (streak >= 7) return { text: `${streak}d streak 🔥`, color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
  if (rate >= 0.5) return { text: 'Good progress', color: '#818CF8', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)' };
  return null;
}

export function DynamicGreeting({ userData }: { userData: UserData }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const timeOfDay = getTimeOfDay();
  const emoji = getTimeEmoji(timeOfDay);
  const badge = getStatusBadge(userData.completedToday, userData.totalHabits, userData.streak);
  const firstName = userData.name.split(' ')[0];

  useEffect(() => {
    const cacheKey = `dashboard-msg-${new Date().toDateString()}-${userData.completedToday}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setMessage(cached);
      setLoading(false);
      return;
    }

    fetch('/api/dashboard-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData: { ...userData, timeOfDay } }),
    })
      .then((r) => r.json())
      .then((data) => {
        const msg = data.message ?? "Keep showing up. That's all it takes.";
        setMessage(msg);
        sessionStorage.setItem(cacheKey, msg);
      })
      .catch(() => setMessage("Keep showing up. That's all it takes."))
      .finally(() => setLoading(false));
  }, [userData.completedToday]);

  const dateChip = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <div className="mb-8">
      {/* Name + date row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[32px] font-semibold text-text-primary leading-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span className="emoji" style={{ fontSize: 28, marginRight: 8, verticalAlign: 'middle' }}>
              {emoji}
            </span>
            Good {timeOfDay}, {firstName}
          </h1>

          {/* AI dynamic message */}
          <div className="flex items-center gap-2.5 mt-1.5 min-h-[22px]">
            {loading ? (
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block rounded-full"
                    style={{
                      width: 5, height: 5,
                      background: 'rgba(99,102,241,0.5)',
                      animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p
                className="text-[14px] text-text-muted"
                style={{ animation: 'fadeInUp 0.4s ease both' }}
              >
                {message}
              </p>
            )}

            {badge && !loading && (
              <span
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{
                  color: badge.color,
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  animation: 'fadeInUp 0.4s ease 0.2s both',
                }}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>

        {/* Date chip */}
        <div
          className="flex-shrink-0 text-[13px] px-3.5 py-1.5 rounded-full text-text-secondary whitespace-nowrap mt-1"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          {dateChip}
        </div>
      </div>

      {/* Decorative line */}
      <div
        className="mt-4 h-px w-[200px]"
        style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.5), transparent)' }}
      />
    </div>
  );
}
