import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Inbox, CheckCircle2, XCircle, Undo2, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RequestStatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listAllRequests, resolveRequest, refundRequestCredit } from '@/services/requests.service';
import { listResellers } from '@/services/resellers.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatDateTime, formatDuration } from '@/lib/utils';
import type { CanvaRequest, Profile, RequestStatus } from '@/types/database';

type FilterKey = 'all' | RequestStatus;

export default function AdminRequests() {
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [approveTarget, setApproveTarget] = useState<CanvaRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CanvaRequest | null>(null);
  const [refundTarget, setRefundTarget] = useState<CanvaRequest | null>(null);

  const load = useCallback(async () => {
    try {
      const [req, res] = await Promise.all([listAllRequests(), listResellers()]);
      setRequests(req);
      setResellers(res);
    } catch {
      toast.error('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('canva_requests', load);

  const resellersById = useMemo(() => Object.fromEntries(resellers.map((r) => [r.id, r])), [resellers]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.trim().toLowerCase();
      const resellerName = resellersById[r.reseller_id]?.username ?? '';
      const matchesSearch = !q || r.email.toLowerCase().includes(q) || resellerName.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || r.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [requests, search, filter, resellersById]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await resolveRequest(approveTarget.id, 'approved');
      toast.success('¡Correo agregado correctamente!');
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleReject = async (reason?: string) => {
    if (!rejectTarget) return;
    try {
      await resolveRequest(rejectTarget.id, 'rejected', reason);
      toast.success('Solicitud rechazada.');
      setRejectTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      await refundRequestCredit(refundTarget.id);
      toast.success('Crédito devuelto correctamente.');
      setRefundTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div>
      <PageHeader title="Solicitudes Canva" description="Revisa y resuelve las solicitudes enviadas por tus revendedores." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por correo o revendedor..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Inbox className="size-5" />} title="No hay solicitudes" description="Aquí aparecerán las solicitudes enviadas por tus revendedores." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3 font-medium">Revendedor</th>
                  <th className="px-5 py-3 font-medium">Correo solicitado</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-ink-850/60">
                    <td className="px-5 py-3 text-ink-200">@{resellersById[req.reseller_id]?.username ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-ink-100">{req.email}</td>
                    <td className="px-5 py-3">
                      <Badge tone="violet">{formatDuration(req.duration_months)}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-400">{formatDateTime(req.created_at)}</td>
                    <td className="px-5 py-3">
                      <RequestStatusBadge status={req.status} />
                      {req.status === 'rejected' && req.rejection_reason && (
                        <p className="mt-1 max-w-[220px] truncate text-xs text-ink-500" title={req.rejection_reason}>
                          {req.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        {req.status === 'pending' && (
                          <>
                            <Button size="sm" variant="success" onClick={() => setApproveTarget(req)}>
                              <CheckCircle2 className="size-3.5" /> Aprobar
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setRejectTarget(req)}>
                              <XCircle className="size-3.5" /> Rechazar
                            </Button>
                          </>
                        )}
                        {req.status === 'rejected' && (
                          <Button size="sm" variant="secondary" onClick={() => setRefundTarget(req)}>
                            <Undo2 className="size-3.5" /> Devolver crédito
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Aprobar solicitud"
        description={`¿Confirmas que el correo ${approveTarget?.email} fue agregado correctamente a Canva?`}
        confirmLabel="Sí, correo agregado"
        variant="success"
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Rechazar solicitud"
        description={`Indica el motivo por el cual se rechaza la solicitud de ${rejectTarget?.email}.`}
        confirmLabel="Rechazar solicitud"
        variant="danger"
        requireReason
        reasonLabel="Motivo del rechazo"
      />

      <ConfirmDialog
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="Devolver crédito"
        description={`Se sumará 1 crédito a la cuenta de @${resellersById[refundTarget?.reseller_id ?? '']?.username ?? ''}. ¿Continuar?`}
        confirmLabel="Devolver crédito"
      />
    </div>
  );
}
