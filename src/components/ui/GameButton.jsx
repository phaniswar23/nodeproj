import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

const GameButton = forwardRef(
    ({ className, variant = 'primary', size = 'md', glow = false, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={cn(
                    'relative inline-flex items-center justify-center gap-2 font-heading font-bold tracking-wider uppercase rounded-lg transition-all duration-300 ease-out disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
                    {
                        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
                        'bg-secondary text-secondary-foreground hover:bg-secondary/90': variant === 'secondary',
                        'bg-transparent border border-border text-foreground hover:bg-muted': variant === 'ghost',
                        'bg-transparent border-2 border-primary text-primary hover:bg-primary/10': variant === 'outline',
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
                    },
                    {
                        'px-4 py-2 text-xs': size === 'sm',
                        'px-6 py-3 text-sm': size === 'md',
                        'px-8 py-4 text-base': size === 'lg',
                    },
                    glow && variant === 'primary' && 'glow-primary animate-pulse-glow',
                    glow && variant === 'secondary' && 'glow-secondary',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

GameButton.displayName = 'GameButton';

export { GameButton };
