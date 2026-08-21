import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Coins, Inbox, CheckCircle2, XCircle, MailPlus, ArrowRight } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RequestStatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { listMyRequests } from '@/services/requests.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatRelativeTime } from '@/lib/utils';
import type { CanvaRequest } from '@/types/database';

export default function ResellerDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRequests(await listMyRequests());
    } catch {
      toast.error('No se pudieron cargar tus solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('canva_requests', () => {
    load();
    refreshProfile();
  });

  const pendientes = requests.filter((r) => r.status === 'pending').length;
  const aprobadas = requests.filter((r) => r.status === 'approved').length;
  const rechazadas = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink-50 sm:text-2xl">
          Bienvenido, {profile?.full_name?.split(' ')[0] || profile?.username}
        </h1>
        <p className="mt-1 text-sm text-ink-400">Este es el resumen de tu actividad en Canvasolucion.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Créditos disponibles" value={profile?.credits ?? 0} icon={<Coins className="size-[18px]" />} tone="violet" />
        <StatCard label="Pendientes" value={pendientes} icon={<Inbox className="size-[18px]" />} tone="amber" />
        <StatCard label="Aprobadas" value={aprobadas} icon={<CheckCircle2 className="size-[18px]" />} tone="teal" />
        <StatCard label="Rechazadas" value={rechazadas} icon={<XCircle className="size-[18px]" />} tone="rose" />
      </div>

      <Link to="/reseller/agregar-correo" className="mt-6 block">
        <Card className="group relative overflow-hidden p-6 transition-colors hover:border-violet-500/40">
          <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-violet-600/10 blur-2xl transition-opacity group-hover:opacity-80" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                <MailPlus className="size-5" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-ink-50">Agregar correo a Canva</p>
                <p className="text-sm text-ink-400">Envía una nueva solicitud al administrador.</p>
              </div>
            </div>
            <ArrowRight className="size-5 text-ink-500 transition-transform group-hover:translate-x-1 group-hover:text-violet-400" />
          </div>
        </Card>
      </Link>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4">
          <h2 className="font-display text-sm font-semibold text-ink-100">Solicitudes recientes</h2>
          <Link to="/reseller/mis-solicitudes" className="text-xs font-medium text-violet-400 hover:text-violet-300">
            Ver todas
          </Link>
        </div>
        {loading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Aún no has enviado solicitudes"
            description="Usa el botón de arriba para enviar tu primera solicitud."
            action={
              <Link to="/reseller/agregar-correo">
                <Button size="sm">
                  <MailPlus className="size-4" /> Agregar correo
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{req.email}</p>
                  <p className="text-xs text-ink-500">{formatRelativeTime(req.created_at)}</p>
                </div>
                <RequestStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
