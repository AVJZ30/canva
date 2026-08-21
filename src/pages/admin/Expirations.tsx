import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Search, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listAllRequests } from '@/services/requests.service';
import { listResellers } from '@/services/resellers.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatDuration, formatDateTime, getExpirationDate, daysUntil, formatExpirationLabel } from '@/lib/utils';
import type { CanvaRequest, Profile } from '@/types/database';

type FilterKey = 'all' | 'expired' | 'soon' | 'ok';

export default function AdminExpirations() {
  const [requests, setRequests] = useState<CanvaRequest[]>([]);
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    try {
      const [req, res] = await Promise.all([listAllRequests(), listResellers()]);
      setRequests(req);
      setResellers(res);
    } catch {
      toast.error('No se pudieron cargar los vencimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('canva_requests', load);

  const resellersById = useMemo(() => Object.fromEntries(resellers.map((r) => [r.id, r])), [resellers]);

  const withExpiration = useMemo(() => {
    return requests
      .filter((r) => r.status === 'approved' && r.resolved_at)
      .map((r) => {
        const expiration = getExpirationDate(r.resolved_at, r.duration_months)!;
        return { request: r, expiration, days: daysUntil(expiration) };
      })
      .sort((a, b) => a.expiration.getTime() - b.expiration.getTime());
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withExpiration.filter(({ request, days }) => {
      const resellerName = resellersById[request.reseller_id]?.username ?? '';
      const matchesSearch = !q || request.email.toLowerCase().includes(q) || resellerName.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'expired' && days < 0) ||
        (filter === 'soon' && days >= 0 && days <= 7) ||
        (filter === 'ok' && days > 7);
      return matchesSearch && matchesFilter;
    });
  }, [withExpiration, search, filter, resellersById]);

  const expiredCount = withExpiration.filter((x) => x.days < 0).length;
  const soonCount = withExpiration.filter((x) => x.days >= 0 && x.days <= 7).length;

  return (
    <div>
      <PageHeader
        title="Vencimientos"
        description="Correos aprobados, ordenados por fecha de vencimiento del plan contratado."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Vencidos</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-rose-400">{expiredCount}</p>
        </div>
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Vencen en 7 días</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-amber-400">{soonCount}</p>
        </div>
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Correos activos</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-ink-50">{withExpiration.length}</p>
        </div>
      </div>

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
              ['all', 'Todos'],
              ['expired', 'Vencidos'],
              ['soon', 'Por vencer (7 días)'],
              ['ok', 'Vigentes'],
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
          <EmptyState
            icon={<CalendarClock className="size-5" />}
            title="No hay correos en esta categoría"
            description="Aquí verás los correos aprobados junto a su fecha de vencimiento."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3 font-medium">Revendedor</th>
                  <th className="px-5 py-3 font-medium">Correo</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Aprobado</th>
                  <th className="px-5 py-3 font-medium">Vence</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {filtered.map(({ request, expiration, days }) => (
                  <tr key={request.id} className="hover:bg-ink-850/60">
                    <td className="px-5 py-3 text-ink-200">@{resellersById[request.reseller_id]?.username ?? '—'}</td>
                    <td className="px-5 py-3 font-medium text-ink-100">{request.email}</td>
                    <td className="px-5 py-3 text-ink-300">{formatDuration(request.duration_months)}</td>
                    <td className="px-5 py-3 text-ink-400">{formatDateTime(request.resolved_at)}</td>
                    <td className="px-5 py-3 text-ink-400">{formatDateTime(expiration.toISOString())}</td>
                    <td className="px-5 py-3">
                      {days < 0 ? (
                        <Badge tone="rose" dot>
                          <AlertTriangle className="size-3" /> {formatExpirationLabel(days)}
                        </Badge>
                      ) : days <= 7 ? (
                        <Badge tone="amber" dot>{formatExpirationLabel(days)}</Badge>
                      ) : (
                        <Badge tone="teal" dot>{formatExpirationLabel(days)}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
