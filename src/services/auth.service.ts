import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export interface LoginResult {
  profile: Profile;
}

export async function loginWithUsername(username: string, password: string): Promise<LoginResult> {
  const { data: email, error: rpcError } = await supabase.rpc('get_login_email', {
    p_username: username,
  });

  if (rpcError) {
    throw new Error('No se pudo verificar el usuario. Inténtalo nuevamente.');
  }

  if (!email) {
    throw new Error('Usuario o contraseña incorrectos.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error('Usuario o contraseña incorrectos.');
  }

  const profile = await fetchOwnProfile();
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('No se encontró un perfil asociado a esta cuenta.');
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
  }

  return { profile };
}

export async function fetchOwnProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error('No se pudo cambiar la contraseña.');
}
