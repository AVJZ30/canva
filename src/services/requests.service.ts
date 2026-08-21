import { supabase } from '@/lib/supabase';
import type { CanvaRequest, RequestStatus } from '@/types/database';

export async function createRequest(email: string, durationMonths: number): Promise<CanvaRequest> {
  const { data, error } = await supabase.rpc('create_canva_request', {
    p_email: email,
    p_duration_months: durationMonths,
  });
  if (error) throw new Error(mapRequestError(error.message));
  return data as CanvaRequest;
}

function mapRequestError(message: string): string {
  if (message.includes('CREDITOS_INSUFICIENTES')) {
    return 'No tienes créditos disponibles. Contacta al administrador para solicitar más créditos.';
  }
  if (message.includes('CORREO_INVALIDO')) return 'El correo electrónico no es válido.';
  if (message.includes('DURACION_INVALIDA')) return 'Selecciona una duración válida.';
  if (message.includes('CUENTA_INACTIVA')) return 'Tu cuenta está desactivada. Contacta al administrador.';
  return 'No se pudo completar la operación. Inténtalo nuevamente.';
}

export async function listMyRequests(): Promise<CanvaRequest[]> {
  const { data, error } = await supabase
    .from('canva_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CanvaRequest[];
}

export async function listAllRequests(): Promise<CanvaRequest[]> {
  const { data, error } = await supabase
    .from('canva_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CanvaRequest[];
}

export async function resolveRequest(
  requestId: string,
  status: Extract<RequestStatus, 'approved' | 'rejected'>,
  rejectionReason?: string
): Promise<CanvaRequest> {
  const { data, error } = await supabase.rpc('resolve_canva_request', {
    p_request_id: requestId,
    p_status: status,
    p_rejection_reason: rejectionReason ?? null,
  });
  if (error) throw new Error('No se pudo completar la operación. Inténtalo nuevamente.');
  return data as CanvaRequest;
}

export async function refundRequestCredit(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('refund_request_credit', { p_request_id: requestId });
  if (error) throw new Error('No se pudo devolver el crédito.');
}
