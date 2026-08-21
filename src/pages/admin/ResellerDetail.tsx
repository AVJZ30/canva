import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Coins, Inbox, History as HistoryIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PresenceBadge, RequestStatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { getResellerById } from '@/services/resellers.service';
import { listResellerTransactions } from '@/services/credits.service';
import { listAllRequests } from '@/services/requests.service';
import { formatDateTime, formatRelativeTime, formatDuration, initials } from '@/lib/utils';
import type { Profile, CreditTransaction, CanvaRequest } from '@/types/database';

export default function AdminResellerDetail() {
  const { id } = useParams<{ id: string }>();
  const [reseller, setReseller] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, tx, allReq] = await Promise.all([
        getResellerById(id),
        listResellerTransactions(id),
        listAllRequests(),
      ]);
      setReseller(r);
      setTransactions(tx);
      setRequests(allReq.filter((req) => req.reseller_id === id));
    } catch {
      toast.error('No se pudo cargar la información del revendedor.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <TableSkeleton rows={6} cols={4} />;
  }

  if (!reseller) {
    return (
      <EmptyState
        icon={<Inbox className="size-5" />}
        title="Revendedor no encontrado"
        action={
          <Link to="/admin/revendedores">
            <Button size="sm" variant="secondary">
              Volver a revendedores
            </Button>
          </Link>
        }
      />
    );
  }

  const pendientes = requests.filter((r) => r.status === 'pending').length;
  const aprobadas = requests.filter((r) => r.status === 'approved').length;
  const rechazadas = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div>
      <Link to="/admin/revendedores" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200">
        <ArrowLeft className="size-4" /> Volver a revendedores
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-semibold text-violet-300">
          {initials(reseller.full_name || reseller.username)}
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-50">{reseller.full_name || reseller.username}</h1>
          <p className="text-sm text-ink-400">
            @{reseller.username} · <PresenceBadgeInline lastSeen={reseller.last_seen} isActive={reseller.is_active} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Créditos" value={reseller.credits} icon={<Coins className="size-4" />} />
        <MiniStat label="Pendientes" value={pendientes} icon={<Inbox className="size-4" />} />
        <MiniStat label="Aprobadas" value={aprobadas} icon={<Inbox className="size-4" />} />
        <MiniStat label="Rechazadas" value={rechazadas} icon={<Inbox className="size-4" />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 border-b border-ink-700/70 px-5 py-4">
            <Inbox className="size-4 text-ink-400" />
            <h2 className="font-display text-sm font-semibold text-ink-100">Solicitudes</h2>
          </div>
          {requests.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Sin solicitudes" />
          ) : (
            <div className="divide-y divide-ink-700/60">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-100">{req.email}</p>
                    <p className="text-xs text-ink-500">{formatDuration(req.duration_months)} · {formatDateTime(req.created_at)}</p>
                  </div>
                  <RequestStatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-ink-700/70 px-5 py-4">
            <HistoryIcon className="size-4 text-ink-400" />
            <h2 className="font-display text-sm font-semibold text-ink-100">Movimientos de créditos</h2>
          </div>
          {transactions.length === 0 ? (
            <EmptyState icon={<Coins className="size-5" />} title="Sin movimientos" />
          ) : (
            <div className="divide-y divide-ink-700/60">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-200">{tx.description || tx.type}</p>
                    <p className="text-xs text-ink-500">{formatRelativeTime(tx.created_at)}</p>
                  </div>
                  <span className={`font-mono-num text-sm font-semibold ${tx.amount >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-700/80 bg-ink-900/60 p-4">
      <div className="flex items-center gap-1.5 text-ink-400">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono-num mt-2 text-2xl font-semibold text-ink-50">{value}</p>
    </div>
  );
}

function PresenceBadgeInline({ lastSeen, isActive }: { lastSeen: string | null; isActive: boolean }) {
  return <PresenceBadge lastSeen={lastSeen} isActive={isActive} />;
}
