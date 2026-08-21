import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { History as HistoryIcon, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listAllTransactions } from '@/services/credits.service';
import { listResellers } from '@/services/resellers.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatDateTime } from '@/lib/utils';
import type { CreditTransaction, Profile, CreditTxType } from '@/types/database';

const typeLabel: Record<CreditTxType, string> = {
  credit_added: 'Créditos agregados',
  credit_used: 'Crédito usado',
  credit_refunded: 'Crédito devuelto',
  manual_adjustment: 'Ajuste manual',
};

const typeTone: Record<CreditTxType, 'teal' | 'rose' | 'amber' | 'violet'> = {
  credit_added: 'teal',
  credit_used: 'rose',
  credit_refunded: 'amber',
  manual_adjustment: 'violet',
};

export default function AdminHistory() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [tx, res] = await Promise.all([listAllTransactions(), listResellers()]);
      setTransactions(tx);
      setResellers(res);
    } catch {
      toast.error('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('credit_transactions', load);

  const resellersById = useMemo(() => Object.fromEntries(resellers.map((r) => [r.id, r])), [resellers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((tx) => {
      const name = resellersById[tx.reseller_id]?.username ?? '';
      return name.toLowerCase().includes(q) || (tx.description ?? '').toLowerCase().includes(q);
    });
  }, [transactions, search, resellersById]);

  return (
    <div>
      <PageHeader title="Historial" description="Todos los movimientos de créditos registrados en el sistema." />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por revendedor o motivo..." className="pl-10" />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="size-5" />} title="Sin movimientos" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3 font-medium">Revendedor</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Cantidad</th>
                  <th className="px-5 py-3 font-medium">Motivo</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-ink-850/60">
                    <td className="px-5 py-3 font-medium text-ink-100">@{resellersById[tx.reseller_id]?.username ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={typeTone[tx.type]}>{typeLabel[tx.type]}</Badge>
                    </td>
                    <td className={`px-5 py-3 font-mono-num font-semibold ${tx.amount >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount}
                    </td>
                    <td className="px-5 py-3 text-ink-300">{tx.description || '—'}</td>
                    <td className="px-5 py-3 text-ink-400">{formatDateTime(tx.created_at)}</td>
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
