import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import type { NavItem } from './Sidebar';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function MobileTopbar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-ink-700/70 bg-ink-900/80 px-4 py-3 md:hidden">
      <Logo />
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-ink-300 hover:bg-ink-800"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-ink-900 p-5 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800">
                <X className="size-5" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin' || item.to === '/reseller'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-violet-500/12 text-violet-300' : 'text-ink-400 hover:bg-ink-800 hover:text-ink-100'
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
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="size-[18px]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
