import { Outlet } from 'react-router-dom';
import { LayoutDashboard, MailPlus, ListChecks, History, UserCircle } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { MobileTopbar } from '@/components/layout/MobileNav';

const items: NavItem[] = [
  { to: '/reseller', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reseller/agregar-correo', label: 'Agregar correo', icon: MailPlus },
  { to: '/reseller/mis-solicitudes', label: 'Mis solicitudes', icon: ListChecks },
  { to: '/reseller/historial', label: 'Historial', icon: History },
  { to: '/reseller/perfil', label: 'Mi perfil', icon: UserCircle },
];

export default function ResellerLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopbar items={items} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
