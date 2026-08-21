import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export interface CreateResellerInput {
  username: string;
  full_name: string;
  password: string;
  credits: number;
}

export async function listResellers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'reseller')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getResellerById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function createReseller(input: CreateResellerInput): Promise<Profile> {
  const { data, error } = await supabase.functions.invoke('create-reseller', {
    body: input,
  });

  if (error) {
    const message = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
      ? await tryReadFunctionError(error)
      : error.message;
    throw new Error(message || 'No se pudo crear el revendedor.');
  }
  if (data?.error) throw new Error(data.error);

  return data.profile as Profile;
}

async function tryReadFunctionError(error: unknown): Promise<string> {
  try {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      return body?.error ?? 'No se pudo crear el revendedor.';
    }
  } catch {
    // ignore
  }
  return 'No se pudo crear el revendedor.';
}

export async function deleteReseller(resellerId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-reseller', {
    body: { reseller_id: resellerId },
  });
  if (error) throw new Error('No se pudo eliminar el revendedor.');
  if (data?.error) throw new Error(data.error);
}

export async function updateReseller(
  id: string,
  updates: Partial<Pick<Profile, 'full_name' | 'username' | 'is_active'>>
): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Profile;
}

export async function toggleResellerActive(id: string, isActive: boolean): Promise<Profile> {
  return updateReseller(id, { is_active: isActive });
}
