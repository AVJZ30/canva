import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Inbox, MailPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RequestStatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listMyRequests } from '@/services/requests.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatDateTime, formatDuration } from '@/lib/utils';
import type { CanvaRequest, RequestStatus } from '@/types/database';

type FilterKey = 'all' | RequestStatus;

export default function ResellerMyRequests() {
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

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

  useRealtimeTable('canva_requests', load);

  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  return (
    <div>
      <PageHeader
        title="Mis solicitudes"
        description="Historial de todas tus solicitudes de correo enviadas a Canva."
        actions={
          <Link to="/reseller/agregar-correo">
            <Button size="sm">
              <MailPlus className="size-4" /> Nueva solicitud
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'Todas'],
            ['pending', 'Pendientes'],
            ['approved', 'Aprobadas'],
            ['rejected', 'Rechazadas'],
          ] as [FilterKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30'
                : 'bg-ink-800 text-ink-400 hover:text-ink-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Inbox className="size-5" />} title="No hay solicitudes en esta categoría" />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {filtered.map((req) => (
              <div key={req.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{req.email}</p>
                  <p className="text-xs text-ink-500">
                    Plan: {formatDuration(req.duration_months)} · Enviada {formatDateTime(req.created_at)}
                  </p>
                  {req.status === 'rejected' && req.rejection_reason && (
                    <p className="mt-1 text-xs text-rose-400">Motivo: {req.rejection_reason}</p>
                  )}
                  {req.resolved_at && (
                    <p className="text-xs text-ink-500">Resuelta {formatDateTime(req.resolved_at)}</p>
                  )}
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
