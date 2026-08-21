import { Badge } from './Badge';
import type { RequestStatus } from '@/types/database';
import { isOnline } from '@/services/presence.service';

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  if (status === 'pending') return <Badge tone="amber" dot>Pendiente</Badge>;
  if (status === 'approved') return <Badge tone="teal" dot>Aprobada</Badge>;
  return <Badge tone="rose" dot>Rechazada</Badge>;
}

export function PresenceBadge({ lastSeen, isActive }: { lastSeen: string | null; isActive: boolean }) {
  if (!isActive) return <Badge tone="neutral" dot>Inactivo</Badge>;
  const online = isOnline(lastSeen);
  return online ? (
    <Badge tone="teal" dot>Activo</Badge>
  ) : (
    <Badge tone="neutral" dot>Desconectado</Badge>
  );
}
