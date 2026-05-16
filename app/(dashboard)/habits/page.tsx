'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HabitList } from '@/components/habits/habit-list';
import { HabitModal } from '@/components/habits/habit-modal';
import { useHabits } from '@/lib/hooks/useHabits';

export default function HabitsPage() {
  const { data: habits } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);

  const activeCount = habits?.filter((h) => !h.archived).length ?? 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Habits</h1>
          <p className="text-text-muted text-sm mt-1">
            {activeCount} active habit{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          New habit
        </Button>
      </div>

      <HabitList />

      <HabitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
