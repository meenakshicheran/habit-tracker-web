'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle2, Flame, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useHabitStats, useJournalEntries, useSaveJournal } from '@/lib/hooks/useHabits';
import { formatDate, todayISO } from '@/lib/utils';

const BAR_W = 20;
const BAR_GAP = 6;
const CHART_H = 48;
const SVG_W = 7 * BAR_W + 6 * BAR_GAP;
const SVG_H = CHART_H + 20;

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-5 w-16 bg-surface-raised rounded mb-5" />
      {/* Header card */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-raised flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 bg-surface-raised rounded" />
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-surface-raised rounded-full" />
            <div className="h-4 w-12 bg-surface-raised rounded" />
          </div>
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4 h-20 bg-surface-raised" />
        ))}
      </div>
      {/* Heatmap skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="h-4 w-28 bg-surface-raised rounded mb-4" />
        <div className="h-28 bg-surface-raised rounded-lg" />
      </div>
      {/* Bar chart skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="h-4 w-24 bg-surface-raised rounded mb-4" />
        <div className="flex items-end gap-1.5 h-14">
          {[40, 65, 50, 70, 45, 60, 55].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-surface-raised rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      {/* Journal skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="h-4 w-16 bg-surface-raised rounded mb-3" />
        <div className="h-20 bg-surface-raised rounded-xl mb-3" />
        <div className="h-8 w-16 bg-surface-raised rounded-lg" />
      </div>
    </div>
  );
}

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending } = useHabitStats(id);
  const { data: journalEntries, isPending: journalPending } = useJournalEntries(id);
  const { mutate: saveJournal, isPending: isSaving } = useSaveJournal(id);

  const today = todayISO();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (journalEntries) {
      const todayEntry = journalEntries.find((e) => e.date === today);
      setNote(todayEntry?.content ?? '');
    }
  }, [journalEntries, today]);

  function handleSave() {
    if (!note.trim()) return;
    saveJournal(
      { content: note },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  }

  if (isPending) return <DetailSkeleton />;
  if (!data) return null;

  const { habit, streak, totalCompletions, completionRate, last84Days, last7Days } = data;

  const dayLabels = last7Days.map((d) =>
    new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
  );

  const pastEntries = journalEntries?.filter((e) => e.date !== today) ?? [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/habits"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border rounded-2xl p-5 mb-4 flex items-center gap-4"
        style={{ borderLeft: `4px solid ${habit.color}` }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: habit.color + '20' }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-text-primary truncate">{habit.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: habit.color + '20', color: habit.color }}
            >
              {habit.category}
            </span>
            <span className="text-xs text-text-muted capitalize">{habit.frequency}</span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Since {formatDate(habit.createdAt.slice(0, 10))}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { icon: <Flame className="w-4 h-4 text-orange-400" />, label: 'Streak', value: `${streak.current}d` },
          { icon: <TrendingUp className="w-4 h-4 text-blue-400" />, label: 'Best', value: `${streak.longest}d` },
          { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, label: 'Total', value: totalCompletions },
          { icon: <Target className="w-4 h-4 text-purple-400" />, label: 'Rate', value: `${completionRate}%` },
        ].map(({ icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-surface border border-border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-text-primary">{value}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* 12-week heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface border border-border rounded-2xl p-5 mb-4"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4">12-week history</h2>
        <div className="overflow-x-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 14px)',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 14px)',
              gap: '2px',
              minWidth: 'max-content',
            }}
          >
            {last84Days.map((day) => {
              const isToday = day.date === today;
              return (
                <div
                  key={day.date}
                  title={day.date}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: day.completed ? habit.color : '#1f2937',
                    outline: isToday ? '2px solid #6366f1' : undefined,
                    outlineOffset: isToday ? '-2px' : undefined,
                    opacity: day.completed ? 1 : 0.5,
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: '#1f2937', opacity: 0.5 }} />
          <span className="text-[10px] text-text-muted">Missed</span>
          <div className="w-3 h-3 rounded-sm flex-shrink-0 ml-2" style={{ backgroundColor: habit.color }} />
          <span className="text-[10px] text-text-muted">Completed</span>
          <div className="w-3 h-3 rounded-sm flex-shrink-0 ml-2 border-2 border-indigo-400" style={{ backgroundColor: '#1f2937', opacity: 0.5 }} />
          <span className="text-[10px] text-text-muted">Today</span>
        </div>
      </motion.div>

      {/* Last 7 days bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-2xl p-5 mb-4"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-4">Last 7 days</h2>
        <svg width={SVG_W} height={SVG_H} style={{ overflow: 'visible' }}>
          {last7Days.map((day, i) => {
            const isToday = day.date === today;
            const barH = day.completed ? CHART_H : 4;
            const x = i * (BAR_W + BAR_GAP);
            const y = CHART_H - barH;
            const color = isToday ? '#6366f1' : habit.color;
            return (
              <g key={day.date}>
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  rx={4}
                  fill={color}
                  opacity={day.completed ? 1 : 0.25}
                />
                <text
                  x={x + BAR_W / 2}
                  y={CHART_H + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isToday ? '#6366f1' : '#6b7280'}
                  fontWeight={isToday ? 700 : 400}
                >
                  {dayLabels[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Journal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-border rounded-2xl p-5"
      >
        <h2 className="text-sm font-semibold text-text-primary mb-3">Journal</h2>

        <label className="block text-xs text-text-muted mb-1">Today&apos;s note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="How did it go today?"
          className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent transition-colors resize-none"
        />
        <button
          disabled={isSaving || !note.trim()}
          onClick={handleSave}
          className="mt-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          {saved ? 'Saved ✓' : isSaving ? 'Saving…' : 'Save'}
        </button>

        {/* Past entries */}
        {!journalPending && (
          <div className="mt-5 border-t border-border pt-4">
            {pastEntries.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No notes yet — write your first reflection above.
              </p>
            ) : (
              <>
                <p className="text-xs font-medium text-text-muted mb-3">Past entries</p>
                <div className="flex flex-col gap-3">
                  {pastEntries.map((entry) => (
                    <div key={entry.date} className="bg-surface-raised rounded-xl px-3 py-2.5">
                      <p className="text-[11px] text-text-muted mb-1">{formatDate(entry.date)}</p>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
