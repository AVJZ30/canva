import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Coins, Search, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listResellers } from '@/services/resellers.service';
import { addCredits } from '@/services/credits.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import type { Profile } from '@/types/database';

export default function AdminCredits() {
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    try {
      setResellers(await listResellers());
    } catch {
      toast.error('No se pudieron cargar los revendedores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('profiles', load);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resellers;
    return resellers.filter((r) => r.username.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q));
  }, [resellers, search]);

  const totalCredits = resellers.reduce((sum, r) => sum + r.credits, 0);

  return (
    <div>
      <PageHeader title="Créditos" description="Administra los créditos disponibles de cada revendedor." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Créditos en circulación</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-ink-50">{totalCredits}</p>
        </div>
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Revendedores con créditos</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-ink-50">
            {resellers.filter((r) => r.credits > 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Sin créditos</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-ink-50">
            {resellers.filter((r) => r.credits === 0).length}
          </p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar revendedor..." className="pl-10" />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Coins className="size-5" />} title="No hay revendedores" />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-100">{r.full_name || r.username}</p>
                  <p className="text-xs text-ink-500">@{r.username}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono-num text-lg font-semibold text-ink-100">{r.credits}</span>
                  <Button size="sm" variant="secondary" onClick={() => setTarget(r)}>
                    <Plus className="size-3.5" /> Agregar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {target && <AddCreditsModal reseller={target} onClose={() => setTarget(null)} onDone={load} />}
    </div>
  );
}

function AddCreditsModal({ reseller, onClose, onDone }: { reseller: Profile; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('10');
  const [reasonText, setReasonText] = useState('');
  const [loading, setLoading] = useState(false);
  const numericAmount = Number(amount) || 0;

  const handleSubmit = async () => {
    if (numericAmount <= 0) return;
    setLoading(true);
    try {
      await addCredits(reseller.id, numericAmount, reasonText.trim() || 'Créditos agregados por el administrador');
      toast.success(`${numericAmount} créditos agregados a ${reseller.username}.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Agregar créditos"
      description={`Revendedor: ${reseller.username} · Créditos actuales: ${reseller.credits}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={numericAmount <= 0}>
            Agregar {numericAmount > 0 ? numericAmount : ''} créditos
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Cantidad</Label>
          <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <Label>Motivo (opcional)</Label>
          <Input value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder="Ej: recarga mensual" />
        </div>
        <p className="text-sm text-ink-400">
          Resultado: <span className="font-mono-num text-ink-100">{reseller.credits + numericAmount}</span> créditos
        </p>
      </div>
    </Modal>
  );
}
