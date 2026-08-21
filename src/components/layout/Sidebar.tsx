import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { initials } from '@/lib/utils';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const { profile, logout } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-700/70 bg-ink-900/60 px-4 py-5 md:flex">
      <div className="px-2">
        <Logo subtitle />
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin' || item.to === '/reseller'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-500/12 text-violet-300 ring-1 ring-inset ring-violet-500/25'
                  : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
              )
            }
          >
            <item.icon className="size-[18px]" />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && (
              <span className="flex min-w-[20px] items-center justify-center rounded-full bg-violet-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-850 p-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">
          {initials(profile?.full_name || profile?.username || '?')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-100">{profile?.full_name || profile?.username}</p>
          <p className="truncate text-xs text-ink-500">@{profile?.username}</p>
        </div>
        <button
          onClick={() => logout()}
          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-700 hover:text-rose-400"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
