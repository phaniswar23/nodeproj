import { cn } from '@/lib/utils';

export const GlassCard = ({ children, className, hover = false, ...props }) => {
    return (
        <div
            className={cn(
                'glass-card p-6',
                hover && 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
