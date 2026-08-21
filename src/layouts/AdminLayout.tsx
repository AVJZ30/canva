import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { LayoutDashboard, Users, Inbox, Coins, History, Activity, Settings, MailPlus, CalendarClock } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { MobileTopbar } from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { listResellers } from '@/services/resellers.service';
import type { CanvaRequest, Profile } from '@/types/database';

export default function AdminLayout() {
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const resellersRef = useRef<Map<string, Profile>>(new Map());

  useEffect(() => {
    listResellers().then((list) => {
      resellersRef.current = new Map(list.map((r) => [r.id, r]));
    });
  }, []);

  // Si el admin está viendo "Solicitudes Canva", el contador se mantiene en 0
  useEffect(() => {
    if (location.pathname.startsWith('/admin/solicitudes')) {
      setUnread(0);
    }
  }, [location.pathname]);

  const handleNewRequest = useCallback(
    (request: CanvaRequest) => {
      if (request.status !== 'pending') return;
      const reseller = resellersRef.current.get(request.reseller_id);
      toast.message('Nueva solicitud de Canva', {
        description: `${reseller ? '@' + reseller.username : 'Un revendedor'} solicitó: ${request.email}`,
        icon: <MailPlus className="size-4" />,
      });
      if (!location.pathname.startsWith('/admin/solicitudes')) {
        setUnread((n) => n + 1);
      }
    },
    [location.pathname]
  );

  useEffect(() => {
    const channel = supabase
      .channel('admin-new-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'canva_requests' },
        (payload) => handleNewRequest(payload.new as CanvaRequest)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleNewRequest]);

  const items: NavItem[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/revendedores', label: 'Revendedores', icon: Users },
    { to: '/admin/solicitudes', label: 'Solicitudes Canva', icon: Inbox, badge: unread },
    { to: '/admin/vencimientos', label: 'Vencimientos', icon: CalendarClock },
    { to: '/admin/creditos', label: 'Créditos', icon: Coins },
    { to: '/admin/historial', label: 'Historial', icon: History },
    { to: '/admin/actividad', label: 'Actividad', icon: Activity },
    { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ];

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
