import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Activity as ActivityIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton';
import { listActivity } from '@/services/activity.service';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityLog } from '@/types/database';

export default function AdminActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLogs(await listActivity(150));
    } catch {
      toast.error('No se pudo cargar la actividad.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeTable('activity_logs', load);

  return (
    <div>
      <PageHeader title="Actividad" description="Registro de acciones importantes realizadas en el sistema." />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={2} />
        ) : logs.length === 0 ? (
          <EmptyState icon={<ActivityIcon className="size-5" />} title="Sin actividad registrada" />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/12 text-violet-400">
                  <ActivityIcon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-200">{log.description}</p>
                  <p className="text-xs text-ink-500">{formatRelativeTime(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
