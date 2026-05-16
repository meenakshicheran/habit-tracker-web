import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-accent text-background',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        outline: 'border border-border text-text-secondary',
        secondary: 'bg-surface-raised text-text-secondary',
        category: 'font-medium',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  habitColor?: string;
}

export function Badge({ className, variant, size, habitColor, style, ...props }: BadgeProps) {
  const dynamicStyle =
    variant === 'category' && habitColor
      ? { backgroundColor: habitColor + '20', color: habitColor, ...style }
      : style;

  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      style={dynamicStyle}
      {...props}
    />
  );
}
