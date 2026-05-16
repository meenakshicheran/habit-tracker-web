'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

// ─── Pack definitions ─────────────────────────────────────────────────────────

const PACKS = {
  morning: {
    id: 'morning' as const,
    name: 'Morning Routine',
    emoji: '☀️',
    desc: 'Start each day with intention',
    habits: [
      { title: 'Wake up early', icon: '☀️' },
      { title: 'Drink water', icon: '💧' },
      { title: 'Meditate', icon: '🧘' },
      { title: 'Stretch', icon: '🤸' },
      { title: 'Journal', icon: '📓' },
    ],
  },
  deepwork: {
    id: 'deepwork' as const,
    name: 'Deep Work',
    emoji: '🎯',
    desc: 'Maximise focus and output',
    habits: [
      { title: 'No phone 1hr', icon: '📵' },
      { title: 'Focus block', icon: '🎯' },
      { title: 'Review todos', icon: '✅' },
      { title: 'Read 20 pages', icon: '📚' },
    ],
  },
  athlete: {
    id: 'athlete' as const,
    name: 'Athlete',
    emoji: '💪',
    desc: 'Build a strong, disciplined body',
    habits: [
      { title: 'Workout', icon: '💪' },
      { title: 'Protein intake', icon: '🥗' },
      { title: 'Sleep 8hrs', icon: '😴' },
      { title: 'Stretch', icon: '🤸' },
    ],
  },
};

const INTERESTS = ['Health', 'Sleep', 'Fitness', 'Productivity', 'Mindfulness', 'Learning'];

type PackId = keyof typeof PACKS;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedPack, setSelectedPack] = useState<PackId | null>(null);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [addedHabits, setAddedHabits] = useState<{ title: string; icon: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status === 'loading' || !session) {
    return <div className="min-h-screen bg-background" />;
  }

  function toggleInterest(cat: string) {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleAddPack() {
    if (!selectedPack) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/onboarding/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: selectedPack }),
      });
      await res.json();
      setAddedHabits(PACKS[selectedPack].habits);
      setStep(3);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleSaveReminder() {
    if (reminderTime) {
      await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultReminderTime: reminderTime }),
      });
    }
    setStep(4);
  }

  async function handleFinish() {
    setIsSaving(true);
    await fetch('/api/user/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingDone: true }),
    });
    router.replace('/dashboard');
  }

  const name = session.user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          🔥
        </div>
        <span className="text-lg font-bold text-text-primary">HabitFlow</span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="rounded-full transition-all duration-300"
            style={{
              width: s === step ? 24 : 8,
              height: 8,
              backgroundColor: s <= step ? '#6366f1' : '#374151',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ─ Step 1: Interests ─ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
                What do you want to improve?
              </h1>
              <p className="text-text-muted text-sm text-center mb-6">Select all that apply</p>

              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {INTERESTS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleInterest(cat)}
                    className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
                    style={
                      interests.includes(cat)
                        ? { background: '#6366f1', borderColor: '#6366f1', color: '#fff' }
                        : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-text-secondary border border-border hover:bg-surface-raised transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* ─ Step 2: Pack selection ─ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
                Pick a starter pack
              </h1>
              <p className="text-text-muted text-sm text-center mb-6">
                Get a curated set of habits instantly
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {Object.values(PACKS).map((pack) => (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all"
                    style={
                      selectedPack === pack.id
                        ? { borderColor: '#6366f1', backgroundColor: '#6366f1' + '15' }
                        : { borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }
                    }
                  >
                    <span className="text-3xl">{pack.emoji}</span>
                    <span className="text-xs font-semibold text-text-primary text-center leading-tight">
                      {pack.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Pack preview */}
              <AnimatePresence>
                {selectedPack && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-surface-raised rounded-xl overflow-hidden mb-4"
                  >
                    <div className="p-4">
                      <p className="text-xs font-medium text-text-muted mb-2">
                        {PACKS[selectedPack].desc}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {PACKS[selectedPack].habits.map((h) => (
                          <div key={h.title} className="flex items-center gap-2">
                            <span className="text-base">{h.icon}</span>
                            <span className="text-sm text-text-primary">{h.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-text-secondary border border-border hover:bg-surface-raised transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleAddPack}
                  disabled={!selectedPack || isAdding}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                >
                  {isAdding ? 'Adding…' : 'Add this pack'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─ Step 3: Reminder time ─ */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-2xl font-bold text-text-primary text-center mb-1">
                Set your reminder time
              </h1>
              <p className="text-text-muted text-sm text-center mb-8">
                We&apos;ll nudge you to complete your habits each day
              </p>

              <div className="flex justify-center mb-8">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-surface border border-border rounded-2xl px-8 py-4 text-3xl font-bold text-text-primary outline-none focus:border-accent transition-colors text-center"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-text-secondary border border-border hover:bg-surface-raised transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleSaveReminder}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* ─ Step 4: All set ─ */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                You&apos;re all set, {name}!
              </h1>
              <p className="text-text-muted text-sm mb-8">
                Your habit journey starts now. Stay consistent!
              </p>

              {/* Starting stats */}
              <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                {[
                  { label: 'Level', value: '1' },
                  { label: 'XP', value: '0' },
                  { label: 'Streak', value: '0d' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface border border-border rounded-xl p-3">
                    <p className="text-xl font-bold text-text-primary">{value}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Habit preview */}
              {addedHabits.length > 0 && (
                <div className="bg-surface border border-border rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs font-medium text-text-muted mb-3">Your habits</p>
                  <div className="flex flex-col gap-2">
                    {addedHabits.map((h) => (
                      <div key={h.title} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md border border-border flex items-center justify-center flex-shrink-0" />
                        <span className="text-base">{h.icon}</span>
                        <span className="text-sm text-text-primary">{h.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                {isSaving ? 'Loading…' : 'Go to dashboard →'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
