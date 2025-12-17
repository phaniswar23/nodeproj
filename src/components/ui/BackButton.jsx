import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const BackButton = ({ className, label = "Back" }) => {
    const navigate = useNavigate();

    return (
        <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className={cn(
                "group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors pl-0 hover:bg-transparent",
                className
            )}
        >
            <div className="p-2 rounded-full bg-card/50 border border-white/5 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            {label && <span className="text-sm font-medium font-heading uppercase tracking-wider">{label}</span>}
        </Button>
    );
};
