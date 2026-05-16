import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-10 w-full rounded-xl border bg-surface-raised px-3 text-sm text-text-primary placeholder:text-text-muted',
          'outline-none transition-all duration-150',
          'border-border focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
          error && 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export { Input };
