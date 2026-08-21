import { supabase } from '@/lib/supabase';
import type { CreditTransaction, Profile } from '@/types/database';

export async function addCredits(resellerId: string, amount: number, description?: string): Promise<Profile> {
  const { data, error } = await supabase.rpc('adjust_credits', {
    p_reseller_id: resellerId,
    p_amount: Math.abs(amount),
    p_type: 'credit_added',
    p_description: description ?? 'Créditos agregados por el administrador',
    p_related_request_id: null,
  });
  if (error) throw new Error('No se pudo completar la operación. Inténtalo nuevamente.');
  return data as Profile;
}

export async function listAllTransactions(): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CreditTransaction[];
}

export async function listResellerTransactions(resellerId: string): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('reseller_id', resellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CreditTransaction[];
}
