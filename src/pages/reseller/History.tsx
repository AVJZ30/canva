import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { History as HistoryIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { listResellerTransactions } from '@/services/credits.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatDateTime } from '@/lib/utils';
import type { CreditTransaction, CreditTxType } from '@/types/database';

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

export default function ResellerHistory() {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setTransactions(await listResellerTransactions(profile.id));
    } catch {
      toast.error('No se pudo cargar tu historial.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('credit_transactions', load);

  return (
    <div>
      <PageHeader title="Historial" description="Movimientos de tus créditos: agregados, usados y devueltos." />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : transactions.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="size-5" />} title="Sin movimientos todavía" />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <Badge tone={typeTone[tx.type]}>{typeLabel[tx.type]}</Badge>
                  <p className="mt-1.5 truncate text-sm text-ink-300">{tx.description || '—'}</p>
                  <p className="text-xs text-ink-500">{formatDateTime(tx.created_at)}</p>
                </div>
                <span className={`font-mono-num shrink-0 text-lg font-semibold ${tx.amount >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
