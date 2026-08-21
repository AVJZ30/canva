import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl bg-ink-850 border border-ink-600 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500',
        'outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl bg-ink-850 border border-ink-600 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500',
        'outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 resize-none',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-xs font-medium text-ink-300 mb-1.5', className)} {...props} />;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl bg-ink-850 border border-ink-600 px-3.5 py-2.5 text-sm text-ink-100',
        'outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25',
        'disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
