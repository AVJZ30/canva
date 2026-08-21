import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Se suscribe a cambios de una tabla vía Supabase Realtime y ejecuta
 * un callback (típicamente un refetch) cada vez que hay un cambio.
 */
export function useRealtimeTable(table: string, onChange: () => void, filter?: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter ?? 'all'}:${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter]);
}
