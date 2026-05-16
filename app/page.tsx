import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';

const FEATURES = [
  { icon: '🔥', title: 'Streak Tracking', desc: 'Never break the chain with smart streak detection' },
  { icon: '📊', title: 'Rich Analytics', desc: 'GitHub-style heatmap and weekly performance charts' },
  { icon: '🧠', title: 'AI Insights', desc: 'Personalized pattern analysis and habit suggestions' },
  { icon: '🌙', title: 'Dark Mode', desc: 'Beautiful in light or dark — your choice' },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <span className="text-6xl mb-4">🔥</span>
        <h1 className="text-5xl font-bold text-text-primary tracking-tight">HabitFlow</h1>
        <p className="mt-4 text-lg text-text-secondary max-w-md">
          Build better habits. Track your progress. Stay consistent with streaks, analytics, and AI insights.
        </p>

        <div className="flex gap-3 mt-8">
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-background text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-border text-text-primary text-sm font-medium hover:bg-surface-raised transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-border shadow-sm text-center"
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm font-semibold text-text-primary">{f.title}</p>
              <p className="text-xs text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-text-muted border-t border-border">
        © {new Date().getFullYear()} HabitFlow. Built for consistency.
      </footer>
    </div>
  );
}
