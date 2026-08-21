import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'violet' | 'teal' | 'amber' | 'rose' | 'neutral';
  sublabel?: string;
}

const toneRing: Record<NonNullable<StatCardProps['tone']>, string> = {
  violet: 'text-violet-400 bg-violet-500/10',
  teal: 'text-teal-400 bg-teal-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  neutral: 'text-ink-300 bg-ink-700/40',
};

export function StatCard({ label, value, icon, tone = 'violet', sublabel }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-700/80 bg-ink-900/70 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
          <p className="font-mono-num mt-2 text-3xl font-semibold text-ink-50">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
        </div>
        <div className={cn('flex size-9 items-center justify-center rounded-xl', toneRing[tone])}>{icon}</div>
      </div>
      {/* ledger tick strip - signature motif */}
      <div className="mt-4 flex gap-[3px]">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 flex-1 rounded-[1px]',
              i % 4 === 0 ? 'bg-ink-600' : 'bg-ink-700/70'
            )}
          />
        ))}
      </div>
    </div>
  );
}
