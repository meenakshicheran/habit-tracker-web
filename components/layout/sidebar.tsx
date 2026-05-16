'use client';

import { BarChart2, LayoutDashboard, ListTodo, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from '@/lib/theme';
import { getLevelInfo } from '@/lib/gamification';
import { useUserStats } from '@/lib/hooks/useHabits';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'Habits', icon: ListTodo },
  { href: '/stats', label: 'Analytics', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  const name = session?.user?.name ?? session?.user?.email ?? 'User';
  const initials = name
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { data: userStats } = useUserStats();
  const levelInfo = getLevelInfo(userStats?.xp ?? 0);

  return (
    <aside className="hidden md:flex w-56 h-screen fixed left-0 top-0 flex-col bg-background z-30" style={{ borderRight: '1px solid var(--divider)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 flex-shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
        <span className="emoji" style={{ fontSize: 18, display: 'inline-block', animation: 'flame-pulse 2s ease-in-out infinite', filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' }}>🔥</span>
        <span className="text-[18px] font-semibold text-text-primary">HabitFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 py-2 pl-3 pr-3 rounded-lg text-sm transition-all duration-150 border-l-[3px]',
                  active
                    ? 'border-l-accent text-text-primary font-medium'
                    : 'border-l-transparent text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                )}
              style={active ? { background: 'var(--overlay-active)' } : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-accent' : 'text-text-muted')} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid var(--divider)' }}>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors border-l-[3px] border-l-transparent"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-lg text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors border-l-[3px] border-l-transparent"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1">
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center text-xs font-semibold text-text-primary">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">{session?.user?.name ?? 'User'}</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                Lv {levelInfo.current.level}
              </span>
            </div>
            <p className="text-[10px] text-text-muted truncate">{levelInfo.current.name}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
