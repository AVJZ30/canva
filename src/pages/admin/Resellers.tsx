import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Plus, Users, MoreVertical, Coins, Power, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PresenceBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listResellers, createReseller, deleteReseller, toggleResellerActive } from '@/services/resellers.service';
import { addCredits } from '@/services/credits.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatRelativeTime } from '@/lib/utils';
import type { Profile } from '@/types/database';

type FilterKey = 'all' | 'active' | 'inactive' | 'with_credits' | 'no_credits';

export default function AdminResellers() {
  const [resellers, setResellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [creditsTarget, setCreditsTarget] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Profile | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listResellers();
      setResellers(data);
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
    return resellers.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.full_name.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && r.is_active) ||
        (filter === 'inactive' && !r.is_active) ||
        (filter === 'with_credits' && r.credits > 0) ||
        (filter === 'no_credits' && r.credits === 0);

      return matchesSearch && matchesFilter;
    });
  }, [resellers, search, filter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReseller(deleteTarget.id);
      toast.success('Revendedor eliminado correctamente.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo eliminar el revendedor.');
    }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      await toggleResellerActive(toggleTarget.id, !toggleTarget.is_active);
      toast.success(toggleTarget.is_active ? 'Revendedor desactivado.' : 'Revendedor activado.');
      setToggleTarget(null);
      load();
    } catch {
      toast.error('No se pudo completar la operación. Inténtalo nuevamente.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Revendedores"
        description="Crea, edita y administra las cuentas de tus revendedores."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo revendedor
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o usuario..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'Todos'],
              ['active', 'Activos'],
              ['inactive', 'Desconectados'],
              ['with_credits', 'Con créditos'],
              ['no_credits', 'Sin créditos'],
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
          <TableSkeleton rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" />}
            title="No hay revendedores"
            description="Crea tu primer revendedor para empezar a gestionar créditos y solicitudes."
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Nuevo revendedor
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700/70 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-5 py-3 font-medium">Usuario</th>
                  <th className="px-5 py-3 font-medium">Nombre</th>
                  <th className="px-5 py-3 font-medium">Créditos</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Última conexión</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-850/60">
                    <td className="px-5 py-3 font-medium text-ink-100">@{r.username}</td>
                    <td className="px-5 py-3 text-ink-300">{r.full_name}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono-num font-medium text-ink-100">{r.credits}</span>
                    </td>
                    <td className="px-5 py-3">
                      <PresenceBadge lastSeen={r.last_seen} isActive={r.is_active} />
                    </td>
                    <td className="px-5 py-3 text-ink-400">{formatRelativeTime(r.last_seen)}</td>
                    <td className="relative px-5 py-3 text-right">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-100"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                      {menuOpenId === r.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-5 top-11 z-20 w-48 rounded-xl border border-ink-600 bg-ink-850 p-1.5 shadow-xl">
                            <Link
                              to={`/admin/revendedores/${r.id}`}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-ink-700"
                              onClick={() => setMenuOpenId(null)}
                            >
                              <Eye className="size-4" /> Ver detalles
                            </Link>
                            <button
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-700"
                              onClick={() => {
                                setCreditsTarget(r);
                                setMenuOpenId(null);
                              }}
                            >
                              <Coins className="size-4" /> Agregar créditos
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-700"
                              onClick={() => {
                                setToggleTarget(r);
                                setMenuOpenId(null);
                              }}
                            >
                              <Power className="size-4" /> {r.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                              onClick={() => {
                                setDeleteTarget(r);
                                setMenuOpenId(null);
                              }}
                            >
                              <Trash2 className="size-4" /> Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateResellerModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      {creditsTarget && (
        <AddCreditsModal
          reseller={creditsTarget}
          onClose={() => setCreditsTarget(null)}
          onDone={load}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar revendedor"
        description={`¿Estás seguro de que deseas eliminar a ${deleteTarget?.username}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.is_active ? 'Desactivar revendedor' : 'Activar revendedor'}
        description={`¿Confirmas que deseas ${toggleTarget?.is_active ? 'desactivar' : 'activar'} a ${toggleTarget?.username}?`}
        confirmLabel="Confirmar"
      />
    </div>
  );
}

function CreateResellerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [credits, setCredits] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUsername('');
    setFullName('');
    setPassword('');
    setCredits('0');
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!username.trim() || !fullName.trim() || !password) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await createReseller({
        username: username.trim(),
        full_name: fullName.trim(),
        password,
        credits: Number(credits) || 0,
      });
      toast.success('Revendedor creado correctamente.');
      reset();
      onClose();
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nuevo revendedor"
      description="Solo el administrador puede crear cuentas de revendedores."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Crear revendedor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Nombre completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Pérez" />
        </div>
        <div>
          <Label>Usuario</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="juan.perez" />
        </div>
        <div>
          <Label>Contraseña</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <Label>Créditos iniciales</Label>
          <Input type="number" min={0} value={credits} onChange={(e) => setCredits(e.target.value)} />
        </div>
        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 ring-1 ring-inset ring-rose-500/20">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function AddCreditsModal({
  reseller,
  onClose,
  onDone,
}: {
  reseller: Profile;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const numericAmount = Number(amount) || 0;

  const handleSubmit = async () => {
    if (numericAmount <= 0) return;
    setLoading(true);
    try {
      await addCredits(reseller.id, numericAmount, 'Créditos agregados por el administrador');
      toast.success(`${numericAmount} créditos agregados a ${reseller.username}.`);
      onDone();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo completar la operación.');
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
      <Label>Cantidad de créditos a agregar</Label>
      <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
      <p className="mt-3 text-sm text-ink-400">
        Resultado: <span className="font-mono-num text-ink-100">{reseller.credits + numericAmount}</span> créditos
      </p>
    </Modal>
  );
}
