import { cn } from '@/lib/utils';

export function Logo({ className, subtitle }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-[0_0_16px_-2px_rgba(124,92,255,0.7)]">
        <span className="font-display text-sm font-bold text-white">C</span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-semibold tracking-tight text-ink-50">
          Canva<span className="text-violet-400">solucion</span>
        </p>
        {subtitle && <p className="text-[11px] text-ink-400">Panel de gestión para revendedores</p>}
      </div>
    </div>
  );
}
