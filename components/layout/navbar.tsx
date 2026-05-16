'use client';

import { BarChart2, LayoutDashboard, ListTodo, Moon, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'Habits', icon: ListTodo },
  { href: '/stats', label: 'Analytics', icon: BarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/habits': 'My Habits',
  '/stats': 'Analytics',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'HabitFlow';

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-40" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--divider)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base" style={{ display: 'inline-block', animation: 'flame-pulse 2s ease-in-out infinite' }}>🔥</span>
          <span className="font-semibold text-text-primary text-sm">{title}</span>
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 flex items-stretch" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid var(--divider)' }}>
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
            >
              <Icon
                className={cn('w-5 h-5 transition-colors', active ? 'text-accent' : 'text-text-muted')}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-accent' : 'text-text-muted'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
