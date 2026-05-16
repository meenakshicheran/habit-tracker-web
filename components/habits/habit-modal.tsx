'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateHabit, useUpdateHabit, type Habit } from '@/lib/hooks/useHabits';
import { habitSchema } from '@/lib/validations';
import { cn } from '@/lib/utils';

interface Breakdown {
  beginner: { title: string; description: string; duration: string };
  intermediate: { title: string; description: string; duration: string };
  advanced: { title: string; description: string; duration: string };
}

const LEVELS = [
  { key: 'beginner' as const,     label: 'Beginner',      color: '#22c55e', bg: 'rgba(34,197,94,0.10)',    border: 'rgba(34,197,94,0.25)' },
  { key: 'intermediate' as const, label: 'Intermediate',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',   border: 'rgba(245,158,11,0.25)' },
  { key: 'advanced' as const,     label: 'Advanced',      color: '#6366f1', bg: 'rgba(99,102,241,0.10)',   border: 'rgba(99,102,241,0.25)' },
];

const PRESET_ICONS = ['✅', '🏃', '📚', '💧', '🧘', '🎯', '💪', '🌱', '🎨', '🍎', '😴', '🔥'];
const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
const CATEGORIES = ['General', 'Health', 'Learning', 'Fitness', 'Mindfulness', 'Productivity', 'Social', 'Other'];

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

const defaultForm = {
  title: '',
  description: '',
  icon: '✅',
  color: '#3b82f6',
  category: 'General',
  frequency: 'daily',
  targetDays: 7,
  reminderTime: '',
};

export function HabitModal({ open, onClose, habit }: HabitModalProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (habit) {
      setForm({
        title: habit.title,
        description: habit.description ?? '',
        icon: habit.icon,
        color: habit.color,
        category: habit.category,
        frequency: habit.frequency,
        targetDays: habit.targetDays,
        reminderTime: habit.reminderTime ?? '',
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
    setBreakdown(null);
  }, [habit, open]);

  useEffect(() => {
    if (habit) return; // only for new habits
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (form.title.trim().length < 3) { setBreakdown(null); return; }

    debounceRef.current = setTimeout(async () => {
      setBreakdownLoading(true);
      try {
        const res = await fetch('/api/habit-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title }),
        });
        if (res.ok) setBreakdown(await res.json());
      } catch { /* silent */ } finally {
        setBreakdownLoading(false);
      }
    }, 700);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.title, habit]);

  function set<K extends keyof typeof form>(key: K) {
    return (val: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      title: form.title,
      description: form.description || undefined,
      icon: form.icon,
      color: form.color,
      category: form.category,
      frequency: form.frequency as 'daily' | 'weekly' | 'custom',
      targetDays: form.targetDays,
      reminderTime: form.reminderTime || undefined,
    };

    const result = habitSchema.safeParse(payload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => { errs[String(e.path[0])] = e.message; });
      setErrors(errs);
      return;
    }

    try {
      if (habit) {
        await updateHabit.mutateAsync({ id: habit.id, ...result.data });
      } else {
        await createHabit.mutateAsync(result.data);
      }
      onClose();
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    }
  }

  const isLoading = createHabit.isPending || updateHabit.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={habit ? 'Edit Habit' : 'New Habit'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <Input
          id="habit-title"
          label="Title"
          placeholder="e.g. Morning run"
          value={form.title}
          onChange={(e) => set('title')(e.target.value)}
          error={errors.title}
          required
          autoFocus
          className="h-[52px] text-base"
        />

        {/* AI Breakdown */}
        {!habit && (breakdownLoading || breakdown) && (
          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(99,102,241,0.2)',
              background: 'rgba(99,102,241,0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}
            >
              <Sparkles style={{ width: 13, height: 13, color: '#818CF8' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#818CF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                AI Suggestions
              </span>
              {breakdownLoading && (
                <div className="flex gap-1 ml-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block rounded-full" style={{ width: 4, height: 4, background: 'rgba(99,102,241,0.5)', animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Cards */}
            {breakdown && !breakdownLoading && (
              <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                {LEVELS.map(({ key, label, color, bg, border }) => {
                  const item = breakdown[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        set('title')(item.title);
                        set('description')(item.description);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-150 hover:opacity-90"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = bg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Level badge */}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color, background: bg, border: `1px solid ${border}` }}
                      >
                        {label}
                      </span>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary truncate">{item.title}</p>
                        <p className="text-[11px] text-text-muted truncate">{item.description}</p>
                      </div>
                      {/* Duration */}
                      <span className="text-[11px] text-text-muted flex-shrink-0">{item.duration}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="habit-desc" className="text-sm font-medium text-text-secondary">
            Description <span className="text-text-muted">(optional)</span>
          </label>
          <textarea
            id="habit-desc"
            rows={2}
            placeholder="Why does this habit matter to you?"
            value={form.description}
            onChange={(e) => set('description')(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
          />
        </div>

        {/* Icon picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Icon</span>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => set('icon')(emoji)}
                className={cn(
                  'h-11 rounded-xl text-2xl flex items-center justify-center border-2 transition-all duration-150',
                  form.icon === emoji
                    ? 'border-accent scale-105'
                    : 'border-transparent hover:border-border hover:scale-105'
                )}
                style={form.icon === emoji
                  ? { background: 'rgba(99,102,241,0.15)' }
                  : { background: 'var(--icon-bg)' }}
              >
                <span className="emoji">{emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-secondary">Color</span>
          <div className="flex gap-2.5 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => set('color')(color)}
                className="relative w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 flex items-center justify-center"
                style={{
                  backgroundColor: color,
                  boxShadow: form.color === color ? `0 0 0 2px var(--surface), 0 0 0 4px ${color}` : 'none',
                  transform: form.color === color ? 'scale(1.15)' : undefined,
                }}
              >
                {form.color === color && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-category" className="text-sm font-medium text-text-secondary">Category</label>
            <select
              id="habit-category"
              value={form.category}
              onChange={(e) => set('category')(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-frequency" className="text-sm font-medium text-text-secondary">Frequency</label>
            <select
              id="habit-frequency"
              value={form.frequency}
              onChange={(e) => set('frequency')(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Target days (only for custom) */}
          {form.frequency === 'custom' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="habit-target" className="text-sm font-medium text-text-secondary">
                Target days/week
              </label>
              <input
                id="habit-target"
                type="number"
                min={1}
                max={7}
                value={form.targetDays}
                onChange={(e) => set('targetDays')(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* Reminder */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-reminder" className="text-sm font-medium text-text-secondary">
              Reminder <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="habit-reminder"
              type="time"
              value={form.reminderTime}
              onChange={(e) => set('reminderTime')(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {errors.form && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 border border-red-500/20">
            {errors.form}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} className="flex-1">
            {habit ? 'Save changes' : 'Create habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
