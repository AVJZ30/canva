import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'violet' | 'teal' | 'amber' | 'rose' | 'neutral';

const toneClasses: Record<Tone, string> = {
  violet: 'bg-violet-500/12 text-violet-400 ring-1 ring-inset ring-violet-500/25',
  teal: 'bg-teal-500/12 text-teal-400 ring-1 ring-inset ring-teal-500/25',
  amber: 'bg-amber-500/12 text-amber-400 ring-1 ring-inset ring-amber-500/25',
  rose: 'bg-rose-500/12 text-rose-400 ring-1 ring-inset ring-rose-500/25',
  neutral: 'bg-ink-700/50 text-ink-300 ring-1 ring-inset ring-ink-600/50',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = 'neutral', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotColor[tone])} />}
      {children}
    </span>
  );
}

const dotColor: Record<Tone, string> = {
  violet: 'bg-violet-400',
  teal: 'bg-teal-400 shadow-[0_0_6px_1px_rgba(45,217,200,0.6)]',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  neutral: 'bg-ink-400',
};
