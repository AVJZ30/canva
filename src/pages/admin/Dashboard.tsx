import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, Inbox, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequestStatusBadge, PresenceBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listResellers } from '@/services/resellers.service';
import { listAllRequests } from '@/services/requests.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { isOnline } from '@/services/presence.service';
import { formatRelativeTime } from '@/lib/utils';
import type { Profile, CanvaRequest } from '@/types/database';

export default function AdminDashboard() {
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r, req] = await Promise.all([listResellers(), listAllRequests()]);
    setResellers(r);
    setRequests(req);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('profiles', load);
  useRealtimeTable('canva_requests', load);

  const activos = resellers.filter((r) => isOnline(r.last_seen)).length;
  const desconectados = resellers.length - activos;
  const pendientes = requests.filter((r) => r.status === 'pending').length;
  const aprobadas = requests.filter((r) => r.status === 'approved').length;
  const rechazadas = requests.filter((r) => r.status === 'rejected').length;
  const creditosEntregados = requests.length; // 1 credito consumido por solicitud enviada

  const recientes = requests.slice(0, 6);
  const resellersByName = Object.fromEntries(resellers.map((r) => [r.id, r]));
  const topResellers = [...resellers].slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general del sistema de revendedores." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Revendedores" value={resellers.length} icon={<Users className="size-[18px]" />} tone="violet" />
        <StatCard label="Activos" value={activos} icon={<UserCheck className="size-[18px]" />} tone="teal" />
        <StatCard label="Desconectados" value={desconectados} icon={<UserX className="size-[18px]" />} tone="neutral" />
        <StatCard label="Solicitudes pendientes" value={pendientes} icon={<Inbox className="size-[18px]" />} tone="amber" />
        <StatCard label="Solicitudes aprobadas" value={aprobadas} icon={<CheckCircle2 className="size-[18px]" />} tone="teal" />
        <StatCard label="Solicitudes rechazadas" value={rechazadas} icon={<XCircle className="size-[18px]" />} tone="rose" />
        <StatCard label="Créditos consumidos" value={creditosEntregados} icon={<Coins className="size-[18px]" />} tone="violet" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-ink-100">Solicitudes recientes</h2>
            <Link to="/admin/solicitudes" className="text-xs font-medium text-violet-400 hover:text-violet-300">
              Ver todas
            </Link>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : recientes.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Sin solicitudes todavía" />
          ) : (
            <div className="divide-y divide-ink-700/60">
              {recientes.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">{req.email}</p>
                    <p className="text-xs text-ink-500">
                      {resellersByName[req.reseller_id]?.username ?? '—'} · {formatRelativeTime(req.created_at)}
                    </p>
                  </div>
                  <RequestStatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-ink-700/70 px-5 py-4">
            <h2 className="font-display text-sm font-semibold text-ink-100">Revendedores</h2>
            <Link to="/admin/revendedores" className="text-xs font-medium text-violet-400 hover:text-violet-300">
              Ver todos
            </Link>
          </div>
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : topResellers.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="Aún no hay revendedores" />
          ) : (
            <div className="divide-y divide-ink-700/60">
              {topResellers.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">{r.full_name || r.username}</p>
                    <p className="font-mono-num text-xs text-ink-500">{r.credits} créditos</p>
                  </div>
                  <PresenceBadge lastSeen={r.last_seen} isActive={r.is_active} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
