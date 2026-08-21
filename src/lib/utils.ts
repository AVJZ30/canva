import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'justo ahora';
  if (diffSec < 60) return `hace ${diffSec} s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `hace ${diffDay} d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export const DURATION_OPTIONS: { value: number; label: string }[] = [
  ...Array.from({ length: 12 }, (_, i) => {
    const months = i + 1;
    return { value: months, label: months === 12 ? '12 meses (1 año)' : `${months} ${months === 1 ? 'mes' : 'meses'}` };
  }),
  { value: 24, label: '2 años' },
  { value: 36, label: '3 años' },
];

export function formatDuration(months: number): string {
  if (months === 12) return '1 año';
  if (months === 24) return '2 años';
  if (months === 36) return '3 años';
  return `${months} ${months === 1 ? 'mes' : 'meses'}`;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Fecha de vencimiento de un correo aprobado: fecha de aprobación + duración del plan. */
export function getExpirationDate(resolvedAt: string | null, durationMonths: number): Date | null {
  if (!resolvedAt) return null;
  return addMonths(new Date(resolvedAt), durationMonths);
}

/** Días restantes hasta el vencimiento (negativo si ya venció). */
export function daysUntil(date: Date): number {
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatExpirationLabel(days: number): string {
  if (days < 0) return `Vencido hace ${Math.abs(days)} d`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} d`;
}
