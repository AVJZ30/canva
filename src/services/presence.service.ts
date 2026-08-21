import { supabase } from '@/lib/supabase';

/** Ventana dentro de la cual consideramos "activo" a un usuario. */
export const PRESENCE_ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutos
const HEARTBEAT_INTERVAL_MS = 45 * 1000; // 45 segundos

export async function sendHeartbeat(): Promise<void> {
  await supabase.rpc('heartbeat');
}

export function startHeartbeatLoop(): () => void {
  sendHeartbeat();
  const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  const onVisibility = () => {
    if (document.visibilityState === 'visible') sendHeartbeat();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onVisibility);
  };
}

export function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < PRESENCE_ACTIVE_WINDOW_MS;
}
