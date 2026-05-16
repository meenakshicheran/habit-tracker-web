'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Archive, Edit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HabitModal } from '@/components/habits/habit-modal';
import { useArchiveHabit, useDeleteHabit, useHabits, type Habit } from '@/lib/hooks/useHabits';
import { cn } from '@/lib/utils';

export function HabitList() {
  const { data: habits, isPending } = useHabits();
  const deleteHabit = useDeleteHabit();
  const archiveHabit = useArchiveHabit();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = habits
    ? ['all', ...Array.from(new Set(habits.map((h) => h.category)))]
    : ['all'];

  const filtered = habits
    ? habits.filter((h) => !h.archived && (selectedCategory === 'all' || h.category === selectedCategory))
    : [];

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setModalOpen(true);
    setMenuOpenId(null);
  }

  function handleCreate() {
    setEditingHabit(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteHabit.mutateAsync(id);
    setConfirmDeleteId(null);
    setMenuOpenId(null);
  }

  async function handleArchive(id: string) {
    await archiveHabit.mutateAsync(id);
    setMenuOpenId(null);
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-raised rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
              selectedCategory === cat
                ? 'bg-surface-raised text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-raised/60'
            )}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Habit rows */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl">🌱</span>
          <p className="text-text-secondary font-medium">No habits yet</p>
          <p className="text-text-muted text-sm">Create your first habit to get started</p>
          <Button size="sm" onClick={handleCreate} className="mt-2">
            <Plus className="w-4 h-4" />
            New habit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          <AnimatePresence initial={false}>
            {filtered.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative"
              >
                <div className="glass rounded-2xl p-4 flex items-center gap-3">
                  {/* 48×48 emoji square */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: habit.color + '25' }}
                  >
                    {habit.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/habits/${habit.id}`}
                      className="text-[15px] font-medium text-text-primary truncate block hover:text-accent transition-colors duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {habit.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] px-2 py-0.5 rounded-full text-text-secondary" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        {habit.category}
                      </span>
                      <span className="text-[11px] text-text-muted">{habit.frequency}</span>
                      {habit.streak && habit.streak.current > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] font-medium text-orange-400">
                          🔥 {habit.streak.current}d
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === habit.id ? null : habit.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {menuOpenId === habit.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-9 z-20 glass rounded-xl shadow-xl py-1 min-w-[140px]"
                        >
                          {confirmDeleteId === habit.id ? (
                            <div className="px-3 py-2">
                              <p className="text-xs text-text-secondary mb-2">Delete permanently?</p>
                              <div className="flex gap-2">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 text-xs px-2 py-1 rounded-lg bg-white/[0.06] text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                                <button onClick={() => handleDelete(habit.id)} className="flex-1 text-xs px-2 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => openEdit(habit)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors">
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button onClick={() => handleArchive(habit.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors">
                                <Archive className="w-3.5 h-3.5" /> Archive
                              </button>
                              <button onClick={() => setConfirmDeleteId(habit.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <HabitModal open={modalOpen} onClose={() => setModalOpen(false)} habit={editingHabit ?? undefined} />

      {/* Close menu on outside click */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
    </>
  );
}
